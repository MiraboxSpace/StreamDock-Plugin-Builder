// Auto-install script: copies the current .sdPlugin folder into the StreamDock
// plugins directory. Invoked by `npm run build` after the ncc bundle step.
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const { execSync } = require('child_process');

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
    path.join('plugin', 'autofile.js'),
    path.join('plugin', 'devfile.js'),
    path.join('plugin', 'package.json'),
    path.join('plugin', 'package-lock.json'),
    path.join('plugin', 'pnpm-lock.yaml'),
    path.join('plugin', 'yarn.lock'),
    path.join('plugin', 'build'),
    path.join('plugin', 'log'),
    '.git',
    '.vscode'
];

// Kill any running plugin process before deleting PluginPath.
// This prevents EBUSY errors on Windows and, when transitioning from dev mode,
// causes StreamDock to auto-restart the plugin with the new bundle so the user
// does not need to manually restart the app.
let killedDevProcess = false;
if (process.platform === 'win32') {
    try {
        // Output the count of matched processes so we know if something was actually killed.
        // @() forces array semantics so .Count works even for 0 or 1 results.
        const out = execSync(
            `powershell -NoProfile -Command "$p = @(Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*${PluginName}*' }); $p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; $p.Count"`,
            { encoding: 'utf8' }
        );
        killedDevProcess = parseInt(out.trim(), 10) > 0;
    } catch { /* powershell error — no process killed */ }
} else {
    try {
        execSync(`pkill -f "${PluginName}"`, { stdio: 'ignore' });
        killedDevProcess = true;  // pkill exits 0 only when at least one process was matched
    } catch { /* nothing to kill */ }
}
if (killedDevProcess) console.log('Previous plugin process terminated.');

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
    if (killedDevProcess) {
        console.log('StreamDock will restart the plugin with the bundled build automatically.');
    } else {
        console.log('⚠  Please restart the StreamDock app so the plugin is loaded/refreshed.');
    }
} catch (err) {
    console.error(`Copy failed for "${PluginName}":`, err);
}
