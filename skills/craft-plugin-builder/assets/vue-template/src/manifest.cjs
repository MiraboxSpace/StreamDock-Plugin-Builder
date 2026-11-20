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
    en: {
      Name: 'Demo',
      Description: 'A Craft secondary-screen demo plugin'
    },
    zh_CN: {
      Name: '演示',
      Description: 'Craft 副屏演示插件'
    },
    zh_HK: {
      Name: '示範',
      Description: 'Craft 副屏示範插件'
    },
    de: {
      Name: 'Demo',
      Description: 'Ein Demo-Plugin für den Craft-Zweitbildschirm'
    },
    el: {
      Name: 'Επίδειξη',
      Description: 'Πρόσθετο επίδειξης για τη δευτερεύουσα οθόνη Craft'
    },
    es: {
      Name: 'Demostración',
      Description: 'Complemento de demostración para la pantalla secundaria de Craft'
    },
    fr: {
      Name: 'Démonstration',
      Description: 'Plugin de démonstration pour l’écran secondaire Craft'
    },
    it: {
      Name: 'Dimostrazione',
      Description: 'Plugin dimostrativo per lo schermo secondario Craft'
    },
    ja: {
      Name: 'デモ',
      Description: 'Craft サブ画面用デモプラグイン'
    },
    ko: {
      Name: '데모',
      Description: 'Craft 보조 화면용 데모 플러그인'
    },
    pl: {
      Name: 'Demo',
      Description: 'Wtyczka demonstracyjna na dodatkowy ekran Craft'
    },
    pt: {
      Name: 'Demonstração',
      Description: 'Plugin de demonstração para a tela secundária do Craft'
    },
    ru: {
      Name: 'Демонстрация',
      Description: 'Демонстрационный плагин для дополнительного экрана Craft'
    },
    tr: {
      Name: 'Demo',
      Description: 'Craft ikincil ekranı için örnek eklenti'
    }
  }
};

const Actions = [
  {
    UUID: 'action1',
    Icon: 'images/icon.svg',
    i18n: {
      en: {
        Name: 'Text Card',
        Tooltip: 'Show a text card on the secondary screen'
      },
      zh_CN: {
        Name: '文字卡片',
        Tooltip: '在副屏上显示文字卡片'
      },
      zh_HK: {
        Name: '文字卡片',
        Tooltip: '在副屏上顯示文字卡片'
      },
      de: {
        Name: 'Textkarte',
        Tooltip: 'Eine Textkarte auf dem Zweitbildschirm anzeigen'
      },
      el: {
        Name: 'Κάρτα κειμένου',
        Tooltip: 'Εμφάνιση κάρτας κειμένου στη δευτερεύουσα οθόνη'
      },
      es: {
        Name: 'Tarjeta de texto',
        Tooltip: 'Mostrar una tarjeta de texto en la pantalla secundaria'
      },
      fr: {
        Name: 'Carte de texte',
        Tooltip: 'Afficher une carte de texte sur l’écran secondaire'
      },
      it: {
        Name: 'Scheda di testo',
        Tooltip: 'Mostra una scheda di testo sullo schermo secondario'
      },
      ja: {
        Name: 'テキストカード',
        Tooltip: 'サブ画面にテキストカードを表示'
      },
      ko: {
        Name: '텍스트 카드',
        Tooltip: '보조 화면에 텍스트 카드 표시'
      },
      pl: {
        Name: 'Karta tekstowa',
        Tooltip: 'Wyświetl kartę tekstową na dodatkowym ekranie'
      },
      pt: {
        Name: 'Cartão de texto',
        Tooltip: 'Mostrar um cartão de texto na tela secundária'
      },
      ru: {
        Name: 'Текстовая карточка',
        Tooltip: 'Показать текстовую карточку на дополнительном экране'
      },
      tr: {
        Name: 'Metin kartı',
        Tooltip: 'İkincil ekranda bir metin kartı göster'
      }
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
