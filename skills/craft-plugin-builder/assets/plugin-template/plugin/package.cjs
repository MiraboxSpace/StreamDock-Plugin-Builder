const fs = require('node:fs');
const path = require('node:path');
const { createInstaller } = require('./installer.cjs');
const projectDir = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(projectDir, 'manifest.json'), 'utf8'));
const pluginName = manifest.Actions[0].UUID.split('.').slice(0, -1).join('.') + '.mPanelPlugin';
createInstaller({
    projectDir,
    contentDir: projectDir,
    backendDir: path.join(__dirname, 'build'),
    pluginName,
    wrap: false
});
