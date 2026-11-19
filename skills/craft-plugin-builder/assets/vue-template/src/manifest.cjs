// ── Plugin & action declaration (source of truth) ──────────────────────────
// `script/autofile.cjs` reads this file to generate dist/manifest.json and every
// dist/<lang>.json. You edit THIS file, never the generated manifest.json.
//
// Rename rules (Craft):
//   • Plugin.UUID  = the plugin short name. Final plugin id becomes
//                    `com.mirabox.streamdock.<Plugin.UUID>`, installed as the
//                    folder `com.mirabox.streamdock.<Plugin.UUID>.mPanelPlugin`.
//   • Action UUID  = the action short name. Final action id becomes
//                    `com.mirabox.streamdock.<Plugin.UUID>.<UUID>`.
//   • Each action's `UUID` MUST match its file names:
//       src/plugin/actions/<UUID>.ts   (draw logic)
//       src/pages/actions/<UUID>.vue   (Property Inspector)
//   • Every action's Settings MUST contain `ActionGeometry { width, height }` —
//     the default canvas size Craft asks you to draw at.

const Plugin = {
  UUID: 'demo',
  version: '1.0.0',
  APIVersion: '1.0',
  Icon: 'images/icon.svg',
  i18n: {
    en:    { Name: 'Demo',  Description: 'A Craft secondary-screen demo plugin' },
    zh_CN: { Name: '演示',  Description: 'Craft 副屏演示插件' },
    zh_HK: { Name: '演示',  Description: 'Craft 副屏演示插件' },
    ja:    { Name: 'Demo',  Description: 'Craft セカンダリスクリーンのデモプラグイン' },
    ko:    { Name: 'Demo',  Description: 'Craft 보조 화면 데모 플러그인' },
    fr:    { Name: 'Demo',  Description: 'Plugin de démonstration pour écran secondaire Craft' },
    de:    { Name: 'Demo',  Description: 'Craft-Demo-Plugin für den Zweitbildschirm' },
    es:    { Name: 'Demo',  Description: 'Complemento de demostración de pantalla secundaria de Craft' },
    it:    { Name: 'Demo',  Description: 'Plugin demo per schermo secondario Craft' },
    ru:    { Name: 'Demo',  Description: 'Демонстрационный плагин вторичного экрана Craft' },
    pl:    { Name: 'Demo',  Description: 'Wtyczka demonstracyjna ekranu pomocniczego Craft' }
  }
};

const Actions = [
  {
    UUID: 'action1',
    Icon: 'images/icon.svg',
    i18n: {
      en:    { Name: 'Text Card', Tooltip: 'Show a text card on the secondary screen' },
      zh_CN: { Name: '文字卡片', Tooltip: '在副屏上显示一张文字卡片' },
      zh_HK: { Name: '文字卡片', Tooltip: '在副屏上顯示一張文字卡片' },
      ja:    { Name: 'Text Card', Tooltip: 'セカンダリスクリーンにテキストカードを表示' },
      ko:    { Name: 'Text Card', Tooltip: '보조 화면에 텍스트 카드 표시' },
      fr:    { Name: 'Text Card', Tooltip: 'Afficher une carte de texte sur l’écran secondaire' },
      de:    { Name: 'Text Card', Tooltip: 'Eine Textkarte auf dem Zweitbildschirm anzeigen' },
      es:    { Name: 'Text Card', Tooltip: 'Mostrar una tarjeta de texto en la pantalla secundaria' },
      it:    { Name: 'Text Card', Tooltip: 'Mostra una scheda di testo sullo schermo secondario' },
      ru:    { Name: 'Text Card', Tooltip: 'Показать текстовую карточку на вторичном экране' },
      pl:    { Name: 'Text Card', Tooltip: 'Pokaż kartę tekstową na ekranie pomocniczym' }
    },
    state: 0,
    States: [{ FontSize: '10', TitleAlignment: 'bottom' }],
    Settings: {
      // REQUIRED on every Craft action: the default canvas size to draw at.
      ActionGeometry: { width: 680, height: 460 },
      // Example user settings — edit/extend freely (these are NOT special):
      text: 'Hello Craft',
      bgColor: '#10131a',
      textColor: '#ffffff'
    },
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['SecondaryScreen']
  }
];

// !! Do not modify below — autofile.cjs depends on this shape !!
module.exports = { PUUID: Plugin.UUID, Version: Plugin.version, APIVersion: Plugin.APIVersion, CategoryIcon: Plugin.Icon, i18n: Plugin.i18n, Actions };
