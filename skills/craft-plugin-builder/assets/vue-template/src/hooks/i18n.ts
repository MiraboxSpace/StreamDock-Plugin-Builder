// Property Inspector text, by app language. Add keys as your PI grows.
const base = {
  text: 'Text',
  bgColor: 'Background',
  textColor: 'Text Color',
  coordinates: 'Coordinates'
};

export const useI18nStore = () => {
  const language = window.argv[3].application.language;
  const L: Record<string, typeof base> = {
    en: { ...base },
    zh_CN: {
      text: '文字',
      bgColor: '背景颜色',
      textColor: '文字颜色',
      coordinates: '插件坐标'
    },
    zh_HK: {
      text: '文字',
      bgColor: '背景顏色',
      textColor: '文字顏色',
      coordinates: '插件坐標'
    },
    ja: {
      text: 'テキスト',
      bgColor: '背景色',
      textColor: '文字色',
      coordinates: '座標'
    },
    ko: {
      text: '텍스트',
      bgColor: '배경색',
      textColor: '글자색',
      coordinates: '좌표'
    }
  };
  return L[language] ?? L['en'];
};
