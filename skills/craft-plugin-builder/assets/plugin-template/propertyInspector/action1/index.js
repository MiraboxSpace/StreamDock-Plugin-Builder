const fields = ['text', 'bgColor', 'textColor'];
const labels = {
    en: { text: 'Text', bgColor: 'Background', textColor: 'Text color' },
    zh_CN: { text: '文字', bgColor: '背景颜色', textColor: '文字颜色' }
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
