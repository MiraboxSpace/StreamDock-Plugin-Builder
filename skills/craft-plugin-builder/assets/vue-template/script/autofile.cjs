const path = require('path');
const fs = require('fs-extra');
const { resolveCraftPluginsDir } = require('./craft-paths.cjs');

const pluginsRoot = resolveCraftPluginsDir();

const manifest = {};
const { PUUID, Actions, i18n, CategoryIcon, Version, APIVersion } = require('../src/manifest.cjs');
console.log('开始执行自动化构建...');

// 开发环境处理
if (process.argv[2] === 'dev') {
  fs.removeSync('./dist') || fs.mkdirSync('./dist') || fs.copySync('./public', './dist');
  fs.copyFileSync('./script/_.html', './dist/_.html');
}


function updateVersion(oldVersion) {
  const match = oldVersion.match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);

  if (!match) {
    throw new Error(`非法版本号格式: ${oldVersion}`);
  }

  const [, major, minor] = match;

  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  const datePart = `${yy}${mm}${dd}`;

  return `${major}.${minor}.${datePart}`;
}


// 根据用户生成
manifest.Actions = Actions.map((item) => {
  item.Name = item.i18n['en'].Name;
  item.Tooltip = item.i18n['en'].Tooltip;
  item.UUID = `com.mirabox.streamdock.${PUUID}.` + item.UUID;
  item.PropertyInspectorPath = process.argv[2] === 'dev' ? '_.html' : 'index.html';
  return item;
});
manifest.Version = updateVersion(Version);
manifest.APIVersion = APIVersion;
manifest.Name = i18n['en'].Name;
manifest.Icon = CategoryIcon;
manifest.CategoryIcon = CategoryIcon;
manifest.Category = i18n['en'].Name;
manifest.Description = i18n['en'].Description;
manifest.CodePath = process.argv[2] === 'dev' ? '_.html' : 'index.html';

// 版本固定生成
manifest.SDKVersion = 1;
manifest.Author = 'MiraBox';
manifest.URL = 'http://video.hotspotek.com.cn/';
manifest.OS = [
  {
    Platform: 'mac',
    MinimumVersion: '10.11'
  },
  {
    Platform: 'windows',
    MinimumVersion: '7'
  }
];

// 语言文件生成
Object.keys(i18n).forEach((item) => {
  const obj = {};
  obj.Name = i18n[item].Name;
  obj.Category = i18n[item].Name;
  obj.Description = i18n[item].Description;
  manifest.Actions.forEach((action) => {
    const translation = action.i18n[item] || action.i18n.en;
    obj[action.UUID] = {
      Name: translation.Name,
      Tooltip: translation.Tooltip
    };
  });
  obj.Localization = {};
  fs.writeJSONSync(`./dist/${item}.json`, obj);
});

// 生成清单文件
manifest.Actions = manifest.Actions.map((item) => {
  delete item.i18n;
  return item;
});
fs.writeJSONSync('./dist/manifest.json', manifest, { spaces: 2, EOL: '\r\n' });

// 复制到插件文件夹
const PluginName = `com.mirabox.streamdock.${PUUID}.mPanelPlugin`;
const PluginPath = path.resolve(pluginsRoot, PluginName);
const sourcePath = path.resolve('.');
const relativeTarget = path.relative(sourcePath, PluginPath);
const relativeSource = path.relative(PluginPath, sourcePath);
const isInside = relative => relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith('..' + path.sep));
if (isInside(relativeTarget) || isInside(relativeSource)) {
  throw new Error('Install target must not overlap the source');
}
fs.ensureDirSync(PluginPath);
fs.copySync('./dist', PluginPath);
console.log(`Installed plugin to ${PluginPath}`);
if (process.argv[2] === 'dev') {
  console.log('DEVELOPMENT VERSION: test in Craft, then confirm it works before requesting a production build.');
  console.log('Keep the Vite server running. This development installation is not shareable.');
} else {
  console.log('PRODUCTION VERSION installed. Reload Craft; the installer is generated next.');
}
