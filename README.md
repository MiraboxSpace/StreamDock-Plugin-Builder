# StreamDock & Craft Plugin Builder Skills

**English** | [中文](README.zh-CN.md)

Two independent **Agent Skills** in one repository for Claude Code, Codex,
OpenClaw, and Hermes:

| Skill | Target | Templates |
| --- | --- | --- |
| [streamdock-plugin-builder](skills/streamdock-plugin-builder/SKILL.md) | StreamDock keys, dials, Control Bars and cards | Node.js backend + HTML Property Inspector |
| [craft-plugin-builder](skills/craft-plugin-builder/SKILL.md) | MiraBox Craft display-only secondary-screen widgets | Two templates: Node.js backend + HTML Property Inspector, or a Vue web app. Node.js is the default; request Vue to use the Vue template. |

Both skills include their own templates, protocol references, and development/
build instructions. Craft's Node PI includes QWebChannel and the tested
registration/settings-routing fixes. Choose Craft for display widgets and
StreamDock for physical key/dial interactions; their events and install paths
are not interchangeable.

## Installation

### Claude Code (plugin marketplace)

Run these in Claude Code, in order:

```
/plugin marketplace add MiraboxSpace/StreamDock-Plugin-Builder
/plugin install streamdock-plugin-builder@streamdock-marketplace
```

The first line registers this repo as a plugin marketplace; the second installs
the plugin containing both skills. It takes effect in a new session.

### Codex (skill-installer)

Run this in Codex:

```
$skill-installer install https://github.com/MiraboxSpace/StreamDock-Plugin-Builder/tree/main/skills/streamdock-plugin-builder
$skill-installer install https://github.com/MiraboxSpace/StreamDock-Plugin-Builder/tree/main/skills/craft-plugin-builder
```

Codex calls its official script to install the skill into `~/.codex/skills/`.
**Restart Codex** afterward for it to take effect.

### OpenClaw

Clone the repo, then install the skill from the local path:

```
git clone https://github.com/MiraboxSpace/StreamDock-Plugin-Builder
openclaw skills install ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder
openclaw skills install ./StreamDock-Plugin-Builder/skills/craft-plugin-builder
```

Add `--global` to install into `~/.openclaw/skills/` for all local agents.
Start a new session for OpenClaw to load it.

**Or just paste this prompt to OpenClaw and let it install itself:**

```
Install the StreamDock plugin-builder skill from https://github.com/MiraboxSpace/StreamDock-Plugin-Builder — clone the repo and run `openclaw skills install ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder` (add --global for all agents), then start a new session so the skill loads.
```

### Hermes

Clone the repo, then copy the skill folder into the Hermes skills directory:

```
git clone https://github.com/MiraboxSpace/StreamDock-Plugin-Builder
cp -R ./StreamDock-Plugin-Builder/skills/streamdock-plugin-builder \
  ~/.hermes/skills/streamdock-plugin-builder
cp -R ./StreamDock-Plugin-Builder/skills/craft-plugin-builder \
  ~/.hermes/skills/craft-plugin-builder
```

Hermes auto-discovers it on the next startup.

**Or just paste this prompt to Hermes and let it install itself:**

```
Install the StreamDock plugin-builder skill from https://github.com/MiraboxSpace/StreamDock-Plugin-Builder — clone the repo and copy its skills/streamdock-plugin-builder folder to ~/.hermes/skills/streamdock-plugin-builder (so that ~/.hermes/skills/streamdock-plugin-builder/SKILL.md exists), then reload your skills.
```

The single-skill prompts above install StreamDock only. For Craft, use the same
repository with `skills/craft-plugin-builder` and the destination name
`craft-plugin-builder`; run both installations if both skills are needed.

### Manual install (any agent)

Each skill is a self-contained folder: `skills/streamdock-plugin-builder/`
or `skills/craft-plugin-builder/`
(it holds `SKILL.md`, `references/`, and `assets/`). Copy that whole folder into
the matching directory for your agent:

- Claude Code: `~/.claude/skills/streamdock-plugin-builder/`
- Codex: `~/.codex/skills/streamdock-plugin-builder/`
- OpenClaw: `~/.openclaw/skills/streamdock-plugin-builder/`
- Hermes: `~/.hermes/skills/streamdock-plugin-builder/`

For Craft, replace `streamdock-plugin-builder` with `craft-plugin-builder` in
the destination paths above. Copy both folders separately to install both.
Do not copy generated `node_modules/`, `build/`, `log/`, or old ZIP archives.

After copying, the directory should contain `SKILL.md` at its top level (e.g.
`~/.hermes/skills/streamdock-plugin-builder/SKILL.md`).

## Usage

After installing, just describe what you want in natural language. Here are
some example prompts:

> Make me a StreamDock plugin: pressing the key mutes / unmutes, and the key
> shows the current state.

> Make me a coin-flip plugin. In the Property Inspector the user can choose how
> many coins to flip (1–5). Pressing the key plays an ~800 ms SVG frame-by-frame
> toss animation — the coins arc upward, spin edge-on at the peak, then fall and
> land showing each result as H (Heads) or T (Tails) directly on the key. The
> last result stays on the key until the next flip.

The agent loads this skill automatically and follows the workflow: clarify the
requirements → generate from the template → implement the logic → build and
install to StreamDock.

### Craft workflow

Example: “Make a Craft clock widget with configurable colors and resizable layout.”
Craft defaults to the Node template; explicitly request Vue for the
`assets/vue-template/`. Windows Node plugins require Craft >= 5.1.018.1021.
Use `npm run dev`, restart Craft after installation, then test PI settings,
resizing and multiple instances. Only build after confirmation. See the
[Craft skill](skills/craft-plugin-builder/SKILL.md) for the complete workflow.
Do not assume StreamDock's automatic backend reload behavior applies to Craft.

### StreamDock development workflow (what to expect)

The agent works in two stages. Knowing this helps you get the best result:

**Stage 1 — dev mode (iterate until it works)**

The agent runs `npm run dev`, which installs a thin launcher into StreamDock's
plugins folder and reloads the plugin automatically — no bundling needed.

- **First time only:** the agent will ask you to restart the StreamDock app
  once so it picks up the new plugin folder.
- **After each change:** the agent runs `npm run dev` again; StreamDock
  reloads the plugin automatically — no more manual restarts.
- After each `npm run dev` the agent will ask you to **test the plugin in
  StreamDock and report back**. Fix → dev → test until you're satisfied.

**Stage 2 — build (when you're happy with it)**

Once everything works, **tell the agent** — for example:

> "Looks good, please build it."  
> "No problem, pack it."  
> "Works fine, ship it."

The agent then runs `npm run build`, which bundles the plugin into a single
file, installs it, and StreamDock reloads automatically.

> **Why is this step separate?** The dev launcher runs your source code
> directly and exits after each run so StreamDock can reload it. A production
> build bundles everything into one file so the plugin runs reliably without
> a development environment. You need to explicitly ask for the build — the
> agent will not run it automatically.

## Shareable installers

After a confirmed production request, each template's `npm run build` installs
the production version and automatically creates a shareable installer under
the project's `release/` directory. Dock `.sdPlugin` ZIPs contain one same-named
wrapper folder; Craft `.mPanelPlugin` ZIPs put manifest.json directly at root.
Neither output has a `.zip` suffix. The agent provides the installer file link
and actual installation path, not just compiled files. Development deliveries
are explicitly labeled and require testing before release.

You can share these installers with other users or publish them at
[Space](https://space.mirabox.net/contentUpload).

## Repository layout

```text
streamdock-plugin-builder/
├── .claude-plugin/       # One plugin discovers both skills
├── .codex-plugin/        # Discovers the skills directory
└── skills/
    ├── streamdock-plugin-builder/
    │   ├── SKILL.md
    │   ├── references/
    │   └── assets/plugin-template/
    └── craft-plugin-builder/
        ├── SKILL.md
        ├── references/   # Node docs + vue/
        └── assets/
            ├── plugin-template/       # Default Node template with QWebChannel
            └── vue-template/   # Vue template
```

The repository name and plugin ID remain unchanged for existing installations.
Both skills remain independently installable. Claude Code discovers both via
the plugin manifest; Codex discovers the skills directory. OpenClaw and Hermes
can install either folder or both.

## License

MIT
