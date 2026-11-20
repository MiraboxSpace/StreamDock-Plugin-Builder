const base = {
  text: 'Text',
  bgColor: 'Background',
  textColor: 'Text color',
  coordinates: 'Coordinates'
};

export const useI18nStore = () => {
  const language = window.argv[3].application.language;
  const labels: Record<string, typeof base> = {
    en: {
      text: 'Text',
      bgColor: 'Background',
      textColor: 'Text color',
      coordinates: 'Coordinates'
    },
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
      coordinates: '插件座標'
    },
    de: {
      text: 'Text',
      bgColor: 'Hintergrund',
      textColor: 'Textfarbe',
      coordinates: 'Koordinaten'
    },
    el: {
      text: 'Κείμενο',
      bgColor: 'Φόντο',
      textColor: 'Χρώμα κειμένου',
      coordinates: 'Συντεταγμένες'
    },
    es: {
      text: 'Texto',
      bgColor: 'Fondo',
      textColor: 'Color del texto',
      coordinates: 'Coordenadas'
    },
    fr: {
      text: 'Texte',
      bgColor: 'Arrière-plan',
      textColor: 'Couleur du texte',
      coordinates: 'Coordonnées'
    },
    it: {
      text: 'Testo',
      bgColor: 'Sfondo',
      textColor: 'Colore del testo',
      coordinates: 'Coordinate'
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
    },
    pl: {
      text: 'Tekst',
      bgColor: 'Tło',
      textColor: 'Kolor tekstu',
      coordinates: 'Współrzędne'
    },
    pt: {
      text: 'Texto',
      bgColor: 'Fundo',
      textColor: 'Cor do texto',
      coordinates: 'Coordenadas'
    },
    ru: {
      text: 'Текст',
      bgColor: 'Фон',
      textColor: 'Цвет текста',
      coordinates: 'Координаты'
    },
    tr: {
      text: 'Metin',
      bgColor: 'Arka plan',
      textColor: 'Metin rengi',
      coordinates: 'Koordinatlar'
    }
  };
  return labels[language] ?? labels.en;
};
