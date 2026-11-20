const fs = require('node:fs');
const path = require('node:path');
const { zipSync, unzipSync } = require('fflate');

function createInstaller({ projectDir, contentDir, backendDir, pluginName, wrap }) {
    if (!/^com\.[a-z0-9.-]+\.(?:sdPlugin|mPanelPlugin)$/.test(pluginName)) {
        throw new Error('Invalid installer name: ' + pluginName);
    }
    const suffix = wrap ? '.sdPlugin' : '.mPanelPlugin';
    if (!pluginName.endsWith(suffix)) throw new Error('Installer platform/suffix mismatch');
    const files = Object.create(null);
    const excluded = new Set(['node_modules', 'release', 'build', 'build-keepalive', 'dist', 'log', 'logs', 'coverage']);
    function collect(folder, prefix = '', bundled = false) {
        for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
            if (entry.name.startsWith('.') || ['log', 'logs', 'node_modules'].includes(entry.name) ||
                (!bundled && excluded.has(entry.name)) ||
                /\.(?:log|zip|sdPlugin|mPanelPlugin)$/i.test(entry.name) && entry.isFile()) continue;
            const source = path.join(folder, entry.name);
            const name = prefix + entry.name;
            if (entry.isSymbolicLink()) throw new Error('Package assets must not be symlinks: ' + source);
            if (entry.isDirectory()) {
                if (!bundled && backendDir && !prefix && entry.name === 'plugin') continue;
                collect(source, name + '/', bundled);
            } else if (entry.isFile()) {
                if (!prefix && /^(?:package(?:-lock)?\.json|.*\.lock|pnpm-lock\.yaml|README.*|LICENSE)$/i.test(entry.name)) continue;
                files[name] = fs.readFileSync(source);
            }
        }
    }
    collect(contentDir);
    if (backendDir) collect(backendDir, 'plugin/', true);
    if (!files['manifest.json']) throw new Error('Production manifest.json is missing');
    const manifest = JSON.parse(files['manifest.json'].toString('utf8'));
    const paths = [manifest.CodePath, manifest.CodePathWin, manifest.CodePathMac,
        manifest.PropertyInspectorPath, ...(manifest.Actions || []).map(action => action.PropertyInspectorPath)].filter(Boolean);
    if (!paths.length || !(manifest.Actions || []).length) throw new Error('Manifest has no entry or actions');
    for (const entry of paths) {
        const normalized = entry.replaceAll('\\', '/').replace(/^\.\//, '');
        if (!files[normalized]) throw new Error('Production entry missing: ' + entry);
        if (normalized === '_.html') throw new Error('Cannot package a Vue development manifest');
    }
    const backend = files['plugin/index.js']?.toString('utf8') || '';
    if (/const (?:result|ret) = spawnSync\(/.test(backend) ||
        backend.includes('Dev launcher') || backend.includes('Dev launcher —')) {
        throw new Error('Cannot distribute a development launcher; run the production build');
    }
    const prefix = wrap ? pluginName + '/' : '';
    const entries = Object.create(null);
    for (const [name, bytes] of Object.entries(files)) entries[prefix + name] = bytes;
    const archive = zipSync(entries, { level: 6 });
    const verified = unzipSync(archive);
    const manifestPath = prefix + 'manifest.json';
    if (!verified[manifestPath] || Object.keys(verified).length !== Object.keys(entries).length) {
        throw new Error('Installer archive verification failed');
    }
    const outputDir = path.join(projectDir, 'release');
    fs.mkdirSync(outputDir, { recursive: true });
    const output = path.join(outputDir, pluginName);
    fs.writeFileSync(output, archive);
    console.log('Installer: ' + output);
    console.log('Share this installer with other users, or upload it to https://space.mirabox.net/contentUpload');
    return output;
}

module.exports = { createInstaller };
