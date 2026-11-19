const { Plugins, Actions } = require('./utils/plugin');
const plugin = new Plugins();
const escapeXml = value => String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
}[character]));
const dimension = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0
    ? Math.round(Number(value)) : fallback;
const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

plugin.action1 = new Actions({
    default: {
        ActionGeometry: { width: 680, height: 460 },
        text: 'Hello Craft',
        bgColor: '#10131a',
        textColor: '#ffffff'
    },
    render(context) {
        const settings = this.data[context];
        const width = dimension(settings.ActionGeometry?.width, 680);
        const height = dimension(settings.ActionGeometry?.height, 460);
        const fontSize = Math.max(1, Math.round(Math.min(width / 12, height / 5)));
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <rect width="${width}" height="${height}" fill="${color(settings.bgColor, '#10131a')}"/>
            <text x="${width / 2}" y="${height / 2 + fontSize / 3}" text-anchor="middle"
                font-family="Arial" font-size="${fontSize}" fill="${color(settings.textColor, '#ffffff')}">${escapeXml(settings.text)}</text>
        </svg>`;
        plugin.setImage(context, 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svg));
    },
    _willAppear({ context }) {
        this.render(context);
    },
    _didReceiveSettings({ context }) {
        this.render(context);
    },
    sendToPlugin({ context, payload }) {
        if (payload?.refresh && this.data[context]) this.render(context);
    },
    _willDisappear() {}
});
