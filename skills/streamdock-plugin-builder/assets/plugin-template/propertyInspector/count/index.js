/// <reference path="../utils/common.js" />
/// <reference path="../utils/action.js" />

// $local: whether to enable automatic PI text translation (when true, every
//         language file's Localization must be complete).
// $back:  whether you decide when to show the UI yourself (false = show
//         automatically once settings are received).
// $dom:   collect static DOM elements here.
const $local = false, $back = false, $dom = {
    main: $('.sdpi-wrapper'),
    step: $('#step'),
    count: $('#count'),
    reset: $('#reset')
};

// app -> PI event callbacks
const $propEvent = {
    // Persisted settings for this key received: echo them into the UI.
    didReceiveSettings({ settings }) {
        $dom.step.value = settings.step ?? 1;
        $dom.count.value = settings.count ?? 0;
    },
    didReceiveGlobalSettings({ settings }) { },
    // Message sent from the plugin backend via sendToPropertyInspector.
    sendToPropertyInspector(data) { }
};

// Step input -> write into settings. Assigning to $settings auto-persists (debounced).
$dom.step.on('change', () => {
    $settings.step = Number($dom.step.value) || 1;
});

// Reset button -> tell the plugin backend to reset to zero (handled in its sendToPlugin).
$dom.reset.on('click', () => {
    $websocket.sendToPlugin({ reset: true });
});
