import argparse
import json
import os
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import zipfile
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from urllib.parse import unquote


LOCALES = {"de", "el", "en", "es", "fr", "it", "ja", "ko", "pl", "pt", "ru", "tr", "zh_CN", "zh_HK"}
EXCLUDED = {"node_modules", "build", "dist", "release", "log", "logs", "__pycache__"}


class EffectHTML(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canvases = []
        self.properties = []
        self.titles = []
        self.scripts = []
        self.in_title = False
        self.script = None
        self.sections = []
        self.stack = []
        self.styles = []
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        if tag == "html":
            raise ValueError("Do not add an html root tag")
        if tag in {"head", "body", "script"}:
            if self.stack:
                raise ValueError("head, body and script must be top-level sections")
            self.sections.append(tag)
        if tag not in {"meta", "link", "br", "hr", "img", "input", "source", "area", "base", "embed", "param", "track", "wbr"}:
            self.stack.append(tag)
        if tag == "style":
            self.in_style = True
        values = dict(attrs)
        if tag == "canvas":
            self.canvases.append(values)
        if tag == "meta" and "property" in values:
            self.properties.append(values)
        if tag == "title":
            self.in_title = True
        if tag == "script":
            if values.get("src"):
                raise ValueError("Keep this standalone template's scripts inline")
            self.script = ""

    def handle_data(self, data):
        if self.in_style:
            self.styles.append(data)
        if self.in_title:
            self.titles.append(data)
        if self.script is not None:
            self.script += data

    def handle_endtag(self, tag):
        if tag == "html":
            raise ValueError("Do not add an html closing tag")
        if tag == "style":
            self.in_style = False
        if tag in self.stack:
            self.stack = self.stack[:self.stack.index(tag)]
        if tag == "title":
            self.in_title = False
        if tag == "script" and self.script is not None:
            self.scripts.append(self.script)
            self.script = None


def effect_files(source):
    files = []
    for current, directories, names in os.walk(source):
        directories[:] = [name for name in directories if not name.startswith(".") and name not in EXCLUDED]
        for name in directories + names:
            if (Path(current) / name).is_symlink():
                raise ValueError("Effect assets must not be symlinks")
        for name in names:
            if not name.startswith(".") and not name.lower().endswith((".log", ".zip", ".mrgbeffect", ".pyc")):
                files.append(Path(current) / name)
    return sorted(files)


def read_json(file):
    return json.loads(file.read_text(encoding="utf-8-sig"))


def validate(source):
    source = source.resolve(strict=True)
    if not source.is_dir() or not re.fullmatch(r"[A-Za-z0-9]+", source.name):
        raise ValueError("Effect folder name must contain only ASCII letters and digits")
    effect_files(source)
    manifest = read_json(source / "manifest.json")
    if any(not isinstance(manifest.get(key), str) or not manifest[key].strip() for key in ("author", "version", "icon")):
        raise ValueError("Manifest needs nonempty author, version and icon strings")
    if manifest.get("type") != "normal" or manifest["icon"] not in {source.name + ".svg", source.name + ".png"}:
        raise ValueError("Use type normal and a same-named SVG (preferred) or PNG icon")
    icon = (source / manifest["icon"]).read_bytes()
    if manifest["icon"].endswith(".svg"):
        svg = ET.fromstring(icon)
        if svg.tag != "{http://www.w3.org/2000/svg}svg" or svg.get("width") != "240" or svg.get("height") != "240" or svg.get("viewBox") != "0 0 240 240":
            raise ValueError("SVG cover must be 240 x 240 with viewBox 0 0 240 240")
        for element in svg.iter():
            if element.tag.rsplit("}", 1)[-1] in {"script", "foreignObject", "image"}:
                raise ValueError("Use a self-contained vector cover without scripts or embedded images")
            if any(key.lower().startswith("on") or key.rsplit("}", 1)[-1] == "href" or "url(" in value.lower() for key, value in element.attrib.items()):
                raise ValueError("SVG cover must not contain event handlers or linked resources")
    elif len(icon) < 24 or icon[:8] != b"\x89PNG\r\n\x1a\n" or icon[12:16] != b"IHDR" or struct.unpack(">II", icon[16:24]) != (240, 240):
        raise ValueError("PNG fallback cover must be a real 240 x 240 PNG")
    document = EffectHTML()
    document.feed((source / (source.name + ".html")).read_text(encoding="utf-8-sig"))
    if document.sections != ["head", "body", "script"]:
        raise ValueError("Use top-level head, body and script sections in that order")
    styles = re.sub(r"/\*.*?\*/", "", "".join(document.styles), flags=re.S)
    for selector in re.findall(r"([^{}]+)\{", styles):
        if re.search(r"(?<![\w.#-])html(?![\w-])|:root\b", selector, re.I):
            raise ValueError("Do not style the html root; style body or canvas instead")
    if any(re.search(r"document\s*\.\s*documentElement\s*\.\s*style\b", script) for script in document.scripts):
        raise ValueError("Do not set document.documentElement.style")
    if "".join(document.titles).strip() != source.name:
        raise ValueError("HTML title must match the effect folder name")
    if not document.canvases or sum(item.get("id") == "exCanvas" for item in document.canvases) != 1:
        raise ValueError("Exactly one primary exCanvas is required")
    if any(item.get("width") != "320" or item.get("height") != "200" for item in document.canvases):
        raise ValueError("All canvas backing dimensions must be exactly 320 x 200")
    keys = {source.name}
    property_names = set()
    for prop in document.properties:
        name = prop["property"]
        if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", name) or name in property_names:
            raise ValueError("Property names must be unique JavaScript identifiers")
        property_names.add(name)
        if not prop.get("label") or "default" not in prop or prop.get("type") not in {"color", "number", "combobox", "boolean", "textfield"}:
            raise ValueError("Incomplete property metadata: " + name)
        keys.add(prop["label"])
        if prop["type"] == "combobox":
            choices = prop.get("values", "").split(",")
            if not all(choices) or prop["default"] not in choices:
                raise ValueError("Invalid combobox choices/default: " + name)
            keys.update(choices)
    actual = {file.stem for file in source.glob("*.json") if file.name != "manifest.json"}
    if actual != LOCALES:
        raise ValueError("Exactly 14 locale files are required: " + ", ".join(sorted(LOCALES)))
    for language in sorted(LOCALES):
        values = read_json(source / (language + ".json"))
        if set(values) != keys or any(not isinstance(value, str) or not value.strip() for value in values.values()):
            raise ValueError("Missing/unexpected/empty translation keys: " + language)
    node = shutil.which("node")
    if not node or not document.scripts:
        raise ValueError("Node.js and an inline effect script are required for syntax validation")
    for script in document.scripts:
        result = subprocess.run([node, "--check"], input=script, text=True, encoding="utf-8", capture_output=True)
        if result.returncode:
            raise ValueError("Effect JavaScript syntax failed: " + result.stderr)
    print("Validated:", source, "(canvas 320 x 200, cover 240 x 240, 14 locales)")
    return source


def resolve_roots(override=None):
    if override:
        return [Path(override).expanduser().resolve()]
    appdata = os.environ.get("APPDATA")
    if not appdata:
        raise ValueError("Set APPDATA on Windows or pass --root with the verified RGB directory")
    hotspot = Path(appdata) / "HotSpot"
    configuration = hotspot / "configuration.ini"
    data_directory = None
    if configuration.exists():
        raw = configuration.read_bytes()
        text = raw.decode("utf-16") if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else raw.decode("utf-8-sig")
        section = ""
        for entry in text.splitlines():
            line = entry.strip()
            if not line or line.startswith((";", "#")):
                continue
            if line.startswith("[") and line.endswith("]"):
                section = line[1:-1].strip()
            elif section == "DeviceTypeDownNum" and "=" in line:
                key, value = line.split("=", 1)
                if unquote(key.strip()) == "MiraBox Craft":
                    data_directory = value.strip()
                    if data_directory.startswith('"') and data_directory.endswith('"'):
                        data_directory = data_directory[1:-1]
    if data_directory and not Path(data_directory).is_absolute():
        raise ValueError("Configured Craft data directory must be absolute")
    data_root = Path(data_directory) if data_directory else hotspot / "MiraBox Craft"
    roots = [(data_root / "SDModules/mRGB/RGB").resolve()]
    syncrgb = hotspot / "SyncRGB/SDModules/mRGB/RGB"
    if syncrgb.is_dir() and syncrgb.resolve() not in roots:
        roots.append(syncrgb.resolve())
    return roots


def install(source, override, replace):
    targets = [root / source.name for root in resolve_roots(override)]
    for target in targets:
        resolved = target.resolve()
        if target.is_symlink() or resolved == source or source in resolved.parents or resolved in source.parents:
            raise ValueError("Install target must not overlap source or use a symlink")
        if target.exists() and not replace:
            raise ValueError("Effect already exists; use --replace only for an intended update: " + str(target))
    for target in targets:
        for file in effect_files(source):
            destination = target / file.relative_to(source)
            if not destination.resolve().is_relative_to(target.resolve()):
                raise ValueError("Effect destination escapes its folder: " + str(destination))
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.is_symlink():
                raise ValueError("Refusing to overwrite symlink: " + str(destination))
            shutil.copyfile(file, destination)
            if destination.read_bytes() != file.read_bytes():
                raise ValueError("Copy verification failed: " + str(destination))
        print("Installed:", target)
    print("Restart Craft/SyncRGB to discover the new lighting effect, then select it and test its controls.")
    print("Lighting effects do not have separate development/production versions.")


def package(source, output):
    destination = Path(output).resolve() if output else source.parent / "release" / (source.name + ".mRGBEffect")
    if destination.suffix.lower() != ".mrgbeffect" or source in destination.parents:
        raise ValueError("Use an output .mRGBEffect file outside the effect folder")
    destination.parent.mkdir(parents=True, exist_ok=True)
    expected = {}
    with zipfile.ZipFile(destination, "w", zipfile.ZIP_DEFLATED) as archive:
        for file in effect_files(source):
            name = file.relative_to(source).as_posix()
            expected[name] = file.read_bytes()
            archive.writestr(name, expected[name])
    with zipfile.ZipFile(destination) as archive:
        if archive.testzip() is not None or set(archive.namelist()) != set(expected):
            raise ValueError("ZIP verification failed")
        if any(archive.read(name) != value for name, value in expected.items()):
            raise ValueError("ZIP byte verification failed")
    print("Shareable lighting-effect installer:", destination)
    print("ZIP contents are directly at root, without an enclosing effect folder.")
    print("Share this .mRGBEffect installer or publish it at https://space.mirabox.net/contentUpload")


def main():
    parser = argparse.ArgumentParser(description="Validate, install and ZIP fixed-size SyncRGB lighting effects")
    parser.add_argument("command", choices=("validate", "install", "package"))
    parser.add_argument("source", type=Path)
    parser.add_argument("--root", help="Explicit RGB directory; overrides all automatic destinations")
    parser.add_argument("--replace", action="store_true", help="Intentionally update existing effect files")
    parser.add_argument("--output", help="Shareable .mRGBEffect installer output path")
    args = parser.parse_args()
    try:
        source = validate(args.source)
        if args.command == "install":
            install(source, args.root, args.replace)
        elif args.command == "package":
            package(source, args.output)
    except (OSError, ValueError, KeyError, json.JSONDecodeError, zipfile.BadZipFile, ET.ParseError) as error:
        print("Error:", error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
