// Auto-install script: copies the current .sdPlugin folder into the StreamDock
// plugins directory. Invoked by `npm run build` after the ncc bundle step.
const path = require('path');
const os = require('os');
const fs = require('fs-extra');

console.log('Starting automated build...');

const parentDir = path.resolve(__dirname, '..');   // the .sdPlugin folder
const PluginName = path.basename(parentDir);        // folder name = plugin ID

// Plugin install directory (varies by OS)
const pluginsRoot = process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library/Application Support/HotSpot/StreamDock/plugins')
    : path.join(process.env.APPDATA, 'HotSpot/StreamDock/plugins');
const PluginPath = path.join(pluginsRoot, PluginName);

// Paths to exclude when copying (development-only files, not part of the package)
const skip = [
    path.join('plugin', 'node_modules'),
    path.join('plugin', 'index.js'),
    path.join('plugin', 'package.json'),
    path.join('plugin', 'package-lock.json'),
    path.join('plugin', 'pnpm-lock.yaml'),
    path.join('plugin', 'yarn.lock'),
    path.join('plugin', 'build'),
    path.join('plugin', 'log'),
    '.git',
    '.vscode'
];

try {
    fs.removeSync(PluginPath);                      // remove the old version
    fs.ensureDirSync(path.dirname(PluginPath));

    // Copy the whole .sdPlugin folder (excluding development-only files)
    fs.copySync(parentDir, PluginPath, {
        filter: (src) => {
            const rel = path.relative(parentDir, src);
            return !skip.some(s => rel === s || rel.startsWith(s + path.sep));
        }
    });

    // Put the ncc-bundled build/index.js into the package's plugin/ folder
    fs.copySync(path.join(__dirname, 'build'), path.join(PluginPath, 'plugin'));

    console.log(`Plugin "${PluginName}" installed to "${PluginPath}"`);
    console.log('Build succeeded -------------');
    console.log('');
    console.log('⚠  Please restart the StreamDock app so the plugin is loaded/refreshed.');
} catch (err) {
    console.error(`Copy failed for "${PluginName}":`, err);
}
