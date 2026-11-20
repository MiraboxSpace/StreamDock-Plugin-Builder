const path = require('node:path');
const { createInstaller } = require('./installer.cjs');
const { PUUID } = require('../src/manifest.cjs');
const projectDir = path.resolve(__dirname, '..');
createInstaller({
    projectDir,
    contentDir: path.join(projectDir, 'dist'),
    pluginName: 'com.mirabox.streamdock.' + PUUID + '.mPanelPlugin',
    wrap: false
});
