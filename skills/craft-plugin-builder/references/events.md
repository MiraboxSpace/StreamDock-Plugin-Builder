# Craft events

All messages use WebSocket JSON except binary image frames.

| Received by backend | Template handler |
| --- | --- |
| willAppear | Actions._willAppear; settings initialized first |
| didReceiveSettings | Actions._didReceiveSettings; settings refreshed first |
| willDisappear | Actions._willDisappear; state removed afterward |
| sendToPlugin | Actions.sendToPlugin |
| didReceiveGlobalSettings | plugin.didReceiveGlobalSettings |

PI receives didReceiveSettings, sendToPropertyInspector, and
didReceiveGlobalSettings. Initial settings are also in registration actionInfo.

| Outgoing | Shape |
| --- | --- |
| setImage | {event,context,payload:{target:0,image}} |
| setSettings | {event,context,payload:{...settings}} |
| sendToPropertyInspector / sendToPlugin | {event,action,context,payload} |
| getGlobalSettings | {event} |
| setGlobalSettings | {event,payload:{...settings}} |
| openUrl | {event,payload:{url}} |
| lightControl | {event,payload:{active,...}} |

Global setting requests respond to the sender; saves notify the other side.
For PI-originated setSettings/sendToPlugin, context is the PI registration UUID,
not actionInfo.context. Craft routes it to the widget. Backend-originated
messages use the widget context from received events.
The data is in payload.settings. Global settings do not use a widget context.
setSettings excludes ActionGeometry. Resize via image dimensions instead.

Binary image push uses event setImage with header
`{event:"setImage",context,payload:{type:"image/webp"}}`:
four-byte big-endian header byte length, UTF-8 header, then image bytes.
MIME must match the bytes. See sdk-api.md.

## Screen light effect

`plugin.lightControl({active:true,effectStyle:"glow",alarmColor:"#ff5500"})`.
Supported styles: glow, corners, scan, ripple, stripes.
Optional effectRect is null (whole overlay) or {x,y,width,height};
effectOpacity, tintOpacity, diffusion and minimumIntensity are 0–1;
glowWidth, borderWidth and cornerRadius are nonnegative;
pulseEnabled is boolean and pulseDuration >= 1 milliseconds.
Emit only on state transitions. If the instance owns the alarm, turn it off
on disappearance. Centralize multiple alarm sources; one widget must not
clear another's alarm.

Unsupported: keyDown/keyUp, dialDown/dialUp/dialRotate, touchTap, setTitle,
setState, showOk/showAlert, PI appearance/disappearance events,
device/app/system events, titleParametersDidChange.

[Wiki sent events](https://ai.key123.vip:20001/wiki/wiki-0mpkl15e/page/page-f192f0c2-b746-4d73-a821-d6c502ab6a7d)
and [received events](https://ai.key123.vip:20001/wiki/wiki-0mpkl15e/page/page-8f64118a-946a-4cc9-9bd6-1a694d9138c2).
