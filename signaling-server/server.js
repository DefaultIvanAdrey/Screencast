const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

let host = null;             // ws connection currently broadcasting
const viewers = new Map();   // viewerId -> ws

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

// Plain HTTP server: used for the WebSocket upgrade, and doubles as a
// health check endpoint so Render (or any host) can confirm it's alive.
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Screencast signaling server is running.\n');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let role = null;
  let viewerId = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    switch (msg.type) {
      case 'register-host': {
        host = ws;
        role = 'host';
        for (const id of viewers.keys()) {
          send(host, { type: 'viewer-join', id });
        }
        break;
      }

      case 'register-viewer': {
        viewerId = makeId();
        role = 'viewer';
        viewers.set(viewerId, ws);
        send(ws, { type: 'viewer-id', id: viewerId, hostOnline: !!host });
        send(host, { type: 'viewer-join', id: viewerId });
        break;
      }

      // WebRTC signaling (offer/answer/ice-candidate) — relayed as-is.
      default: {
        if (role === 'host' && msg.to) {
          send(viewers.get(msg.to), { ...msg, from: 'host' });
        } else if (role === 'viewer') {
          send(host, { ...msg, from: viewerId });
        }
      }
    }
  });

  ws.on('close', () => {
    if (role === 'host' && host === ws) {
      host = null;
      for (const v of viewers.values()) send(v, { type: 'host-left' });
    } else if (role === 'viewer' && viewerId) {
      viewers.delete(viewerId);
      send(host, { type: 'viewer-leave', id: viewerId });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Signaling server listening on port ${PORT}`);
});
