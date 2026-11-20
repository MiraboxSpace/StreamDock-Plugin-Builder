const fs = require('node:fs');
const path = require('node:path');
const { createInstaller } = require('./installer.cjs');
const projectDir = path.resolve(__dirname, '..');
const pluginName = path.basename(projectDir);
createInstaller({
    projectDir,
    contentDir: projectDir,
    backendDir: path.join(__dirname, 'build'),
    pluginName,
    wrap: true
});
