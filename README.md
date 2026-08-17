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
3. Click **Start sharing** and pick a screen/window.
4. Copy the viewer link shown on the page (it automatically includes the
   signaling server as a `?signal=` parameter, so viewers don't have to
   type anything) and send it to the other devices.
5. On any other device, open that link in a browser — no install, and it
   connects automatically.

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
