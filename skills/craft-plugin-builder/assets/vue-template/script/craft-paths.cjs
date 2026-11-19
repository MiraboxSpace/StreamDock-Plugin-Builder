const fs = require('node:fs');
const path = require('node:path');

function resolveCraftPluginsDir({ env = process.env, platform = process.platform } = {}) {
    if (env.CRAFT_PLUGINS_DIR?.trim()) {
        return path.resolve(env.CRAFT_PLUGINS_DIR.trim());
    }
    if (platform !== 'win32' || !env.APPDATA) {
        throw new Error('Set CRAFT_PLUGINS_DIR to the verified Craft plugins directory');
    }
    const hotspot = path.join(env.APPDATA, 'HotSpot');
    const configuration = path.join(hotspot, 'configuration.ini');
    let bytes;
    try {
        bytes = fs.readFileSync(configuration);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw new Error(`Cannot read Craft data directory configuration: ${configuration}: ${error.message}`);
        }
        return path.join(hotspot, 'MiraBox Craft', 'plugins');
    }
    const text = bytes[0] === 0xff && bytes[1] === 0xfe
        ? bytes.subarray(2).toString('utf16le')
        : bytes.toString('utf8').replace(/^\uFEFF/, '');
    let section = '';
    let dataDirectory;
    for (const entry of text.split(/\r?\n/)) {
        const line = entry.trim();
        if (!line || line.startsWith(';') || line.startsWith('#')) continue;
        const heading = line.match(/^\[([^\]]+)\]$/);
        if (heading) {
            section = heading[1].trim();
            continue;
        }
        if (section !== 'DeviceTypeDownNum') continue;
        const separator = line.indexOf('=');
        if (separator < 0) continue;
        let key = line.slice(0, separator).trim();
        try {
            key = decodeURIComponent(key);
        } catch {
            continue;
        }
        if (key !== 'MiraBox Craft') continue;
        dataDirectory = line.slice(separator + 1).trim();
        if (dataDirectory.startsWith('"') && dataDirectory.endsWith('"')) {
            dataDirectory = dataDirectory.slice(1, -1);
        }
    }
    if (!dataDirectory) {
        return path.join(hotspot, 'MiraBox Craft', 'plugins');
    }
    if (!path.isAbsolute(dataDirectory) || /[\0\r\n]/.test(dataDirectory)) {
        throw new Error(`Invalid Craft data directory in ${configuration}: expected an absolute path`);
    }
    return path.join(dataDirectory, 'plugins');
}

module.exports = { resolveCraftPluginsDir };
