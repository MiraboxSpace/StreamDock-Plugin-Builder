const fields = ['text', 'bgColor', 'textColor'];
const labels = {
    "en": {
        "text": "Text",
        "bgColor": "Background",
        "textColor": "Text color"
    },
    "zh_CN": {
        "text": "文字",
        "bgColor": "背景颜色",
        "textColor": "文字颜色"
    },
    "zh_HK": {
        "text": "文字",
        "bgColor": "背景顏色",
        "textColor": "文字顏色"
    },
    "de": {
        "text": "Text",
        "bgColor": "Hintergrund",
        "textColor": "Textfarbe"
    },
    "el": {
        "text": "Κείμενο",
        "bgColor": "Φόντο",
        "textColor": "Χρώμα κειμένου"
    },
    "es": {
        "text": "Texto",
        "bgColor": "Fondo",
        "textColor": "Color del texto"
    },
    "fr": {
        "text": "Texte",
        "bgColor": "Arrière-plan",
        "textColor": "Couleur du texte"
    },
    "it": {
        "text": "Testo",
        "bgColor": "Sfondo",
        "textColor": "Colore del testo"
    },
    "ja": {
        "text": "テキスト",
        "bgColor": "背景色",
        "textColor": "文字色"
    },
    "ko": {
        "text": "텍스트",
        "bgColor": "배경색",
        "textColor": "글자색"
    },
    "pl": {
        "text": "Tekst",
        "bgColor": "Tło",
        "textColor": "Kolor tekstu"
    },
    "pt": {
        "text": "Texto",
        "bgColor": "Fundo",
        "textColor": "Cor do texto"
    },
    "ru": {
        "text": "Текст",
        "bgColor": "Фон",
        "textColor": "Цвет текста"
    },
    "tr": {
        "text": "Metin",
        "bgColor": "Arka plan",
        "textColor": "Metin rengi"
    }
};
const defaults = { text: 'Hello Craft', bgColor: '#10131a', textColor: '#ffffff' };
$propEvent.didReceiveSettings = () => {
    for (const field of fields) document.getElementById(field).value = $settings[field] ?? defaults[field];
};
$propEvent.connected = info => {
    const language = labels[info.application?.language] || labels.en;
    document.querySelectorAll('[data-label]').forEach(element => {
        element.textContent = language[element.dataset.label];
    });
};
for (const field of fields) {
    document.getElementById(field).addEventListener('input', event => {
        if ($settings) $settings[field] = event.target.value;
    });
}
