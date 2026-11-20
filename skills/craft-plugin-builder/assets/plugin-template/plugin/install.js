const fs = require('node:fs');
const path = require('node:path');
const { resolveCraftPluginsDir } = require('./craft-paths.cjs');

module.exports = function install(mode) {
    const source = path.resolve(__dirname, '..');
    const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
    const pluginId = manifest.Actions[0]?.UUID?.split('.').slice(0, -1).join('.');
    if (!/^com\.[a-z0-9]+(?:\.[a-z0-9-]+)+$/.test(pluginId)) throw new Error('Invalid plugin UUID');
    if (manifest.CodePath !== 'plugin/index.js') throw new Error('Expected CodePath plugin/index.js');
    const root = resolveCraftPluginsDir();
    const target = path.resolve(root, pluginId + '.mPanelPlugin');
    if (target === source || target.startsWith(source + path.sep) || source.startsWith(target + path.sep)) {
        throw new Error('Install target must not overlap the source');
    }
    const bundle = path.join(__dirname, 'build');
    if (mode === 'build' && !fs.existsSync(path.join(bundle, 'index.js'))) throw new Error('Run npm run bundle first');
    fs.mkdirSync(path.join(target, 'plugin'), { recursive: true });
    for (const item of fs.readdirSync(source)) {
        if (item === 'static' || item === 'propertyInspector' || item.endsWith('.json')) {
            fs.cpSync(path.join(source, item), path.join(target, item), { recursive: true });
        }
    }
    if (mode === 'dev') {
        const launcher = [
            "const { spawnSync } = require('node:child_process');",
            `const result = spawnSync(${JSON.stringify(process.execPath)}, [${JSON.stringify(path.join(__dirname, 'index.js'))}, ...process.argv.slice(2)], {`,
            `    cwd: ${JSON.stringify(__dirname)}, stdio: 'inherit', windowsHide: true`,
            '});',
            'if (result.error) console.error(result.error);',
            'process.exit(result.status ?? 1);'
        ].join('\n');
        fs.writeFileSync(path.join(target, 'plugin', 'index.js'), launcher);
    } else {
        fs.cpSync(bundle, path.join(target, 'plugin'), { recursive: true });
    }
    console.log(`Installed ${mode} plugin to ${target}`);
    if (mode === 'dev') {
        console.log('DEVELOPMENT VERSION: restart Craft and test settings, resizing and multiple widgets.');
        console.log('Please confirm it works, then ask for a production build. This launcher is not shareable.');
    } else {
        console.log('PRODUCTION VERSION installed. Restart Craft to load it; the installer is generated next.');
    }
};
