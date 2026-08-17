# Input Helper (optional — enables remote control)

This is a small program that runs **only on the host machine** (the one
being controlled). It listens on `localhost` for input events forwarded
from `host.html` and simulates real mouse/keyboard actions at the OS level,
using [nut-js](https://nutjs.dev/).

Viewers still need nothing installed — they just click a "Take control"
button in their browser tab.

## Why this is needed

Browsers deliberately don't allow a web page to move your mouse or type
on your keyboard system-wide — that would be a huge security hole. So the
video/audio/UI parts of Screencast can be pure browser pages, but actual
input injection needs a small native helper with OS permissions. This is
the same reason cloud-gaming/remote-desktop tools always ship a native
client or agent on at least one end.

## Setup

```bash
cd input-helper
npm install
npm start
```

You should see:
```
Input helper listening on ws://localhost:5900
Detected screen size: 1920x1080
Waiting for host.html to connect...
```

Leave this running. Then on the `host.html` page (same machine), check
**Remote control**, leave the URL as `ws://localhost:5900` (or match the
port if you changed it), and it should show "connected".

### macOS

The first time it runs, macOS will need you to grant **Accessibility**
permission to your terminal app (or to `node` itself) under
**System Settings → Privacy & Security → Accessibility**. Without this,
mouse/keyboard simulation silently does nothing.

### Windows

Should work out of the box — no extra permissions typically required.

### Linux

Needs a real X11 or XWayland session (works under GNOME/KDE on most
distros; pure Wayland compositors without XWayland may not work). You may
also need `libxtst-dev` and `libpng-dev` installed if you build from
source rather than using a prebuilt binary:
```bash
sudo apt install libxtst-dev libpng-dev
```

## Security note

Anyone with **Take control** access on a viewer device can fully control
your host machine's mouse and keyboard. Only share the viewer link with
people you trust, and uncheck "Remote control" on the host page (or stop
`input-helper`) when you're done.

## Changing the port

```bash
HELPER_PORT=6100 npm start
```
(and update the URL field on `host.html` to match).
