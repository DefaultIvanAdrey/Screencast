# Screencast (hosted version)

This is the split-hosting version of the Screencast app:

- **`docs/`** — the web pages (`host.html`, `viewer.html`). Deploy these to
  **GitHub Pages**. Static files only, nothing to run.
- **`signaling-server/`** — the small Node/WebSocket relay that lets host and
  viewer devices find each other and exchange the WebRTC handshake. Deploy
  this to a host that runs Node processes, like **Render** (free tier, no
  credit card). It never sees or touches your actual video.

Because both pieces are on servers you don't control locally, there's
**nothing to configure in your firewall or router** — your PC only makes
outbound connections, which every OS allows by default.

## 1. Deploy the signaling server (Render)

1. Push this whole project (or just the `signaling-server/` folder) to a
   GitHub repo.
2. Go to [render.com](https://render.com) → **New** → **Web Service** →
   connect your repo.
3. Settings:
   - **Root directory:** `signaling-server` (if you pushed the whole repo)
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
4. Deploy. Render gives you a URL like `https://screencast-xyz.onrender.com`.
5. Your signaling WebSocket URL is that, with `https` swapped for `wss`:
   `wss://screencast-xyz.onrender.com`

   Note: Render's free tier spins down after inactivity and takes ~30–50s to
   wake back up on the next connection. Fine for casual use; for something
   you use constantly, a paid instance (or Fly.io) avoids the cold start.

## 2. Deploy the pages (GitHub Pages)

1. In your repo, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   branch `main` (or wherever you pushed), folder **`/docs`**.
3. Save. GitHub gives you a URL like
   `https://yourname.github.io/your-repo/host.html`.

## 3. Use it

1. On the broadcasting device, open your GitHub Pages `host.html` URL.
2. Paste your Render signaling URL (`wss://...`) into the **Signaling
   server** field at the top and click **Save**.
3. Pick a **Quality** preset (Low latency / Balanced / High quality — all
   target 60fps; the difference is bitrate and how the encoder trades
   resolution vs framerate under load).
4. Click **Start sharing** and pick a screen/window.
5. Copy the viewer link shown on the page (it automatically includes the
   signaling server as a `?signal=` parameter, so viewers don't have to
   type anything) and send it to the other devices.
6. On any other device, open that link in a browser — no install, and it
   connects automatically. If a "Take control" button appears, they can
   click it to forward their mouse/keyboard to your machine (see
   `input-helper/README.md` to enable that on your end).

## Quality, latency, and remote control

- **60fps / higher bitrate:** `host.html` now requests 60fps capture and
  applies bitrate/framerate encoding parameters per the selected quality
  preset (4–15 Mbps). You can switch presets live while sharing.
- **Lower latency:** the viewer trims WebRTC's jitter buffer
  (`playoutDelayHint = 0`) and the video track is tagged `contentHint =
  'motion'` so the encoder favors framerate/motion smoothness over fine
  detail — closer to how game-streaming tools tune video.
- **Remote control (cloud-gaming style input forwarding):** a WebRTC data
  channel forwards mouse/keyboard events from any viewer that clicks "Take
  control" back to the host. Actually *acting* on those events on the host
  OS requires the small native `input-helper` program (see
  `input-helper/README.md`) — a browser tab alone cannot inject system
  input, so this is the one piece that needs installing, and only on the
  host machine.

## Notes

- The `host.html` page remembers the signaling URL (via `localStorage`), so
  you only need to paste it once per browser.
- Video still tries to flow **directly peer-to-peer** between devices via
  WebRTC — only the initial handshake goes through Render. If both devices
  are on the same Wi-Fi, that direct path is usually what gets used, so
  video quality/latency should feel about the same as the fully-local setup.
- If devices are on different networks (e.g. one on cellular), this
  configuration may still fail to connect, because there's no TURN server
  for relaying video through strict NATs — only STUN. If you need that to
  work reliably, say so and I can add a free/low-cost TURN option (e.g.
  Twilio's or a small `coturn` deployment on Render).
- GitHub Pages is served over HTTPS by default, so screen capture
  (`getDisplayMedia`) will just work without the local secure-context caveat
  from the fully-local setup.
