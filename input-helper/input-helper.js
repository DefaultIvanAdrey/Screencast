// Runs on the HOST machine only (the one being controlled). It listens
// locally for input events relayed from host.html over a WebSocket, and
// uses nut-js to actually move the mouse / press keys at the OS level.
//
// This does NOT need to be reachable from other devices — host.html
// connects to it as ws://localhost:<port>, purely on the same machine.

const { WebSocketServer } = require('ws');
const { mouse, keyboard, screen, Point, Button, Key } = require('@nut-tree-fork/nut-js');

const PORT = process.env.HELPER_PORT || 5900;

mouse.config.mouseSpeed = 4000; // near-instant moves, since we're driving from absolute coords
keyboard.config.autoDelayMs = 0;

const BUTTON_MAP = { 0: Button.LEFT, 1: Button.MIDDLE, 2: Button.RIGHT };

const KEY_MAP = {
  ' ': Key.Space,
  Enter: Key.Enter,
  Backspace: Key.Backspace,
  Tab: Key.Tab,
  Escape: Key.Escape,
  ArrowUp: Key.Up,
  ArrowDown: Key.Down,
  ArrowLeft: Key.Left,
  ArrowRight: Key.Right,
  Shift: Key.LeftShift,
  Control: Key.LeftControl,
  Alt: Key.LeftAlt,
  Meta: Key.LeftSuper,
  CapsLock: Key.CapsLock,
  Delete: Key.Delete,
  Home: Key.Home,
  End: Key.End,
  PageUp: Key.PageUp,
  PageDown: Key.PageDown
};

function mapKey(key) {
  if (KEY_MAP[key]) return KEY_MAP[key];
  const upper = key.length === 1 ? key.toUpperCase() : key;
  return Key[upper] || null;
}

let screenWidth = 1920;
let screenHeight = 1080;

async function init() {
  screenWidth = await screen.width();
  screenHeight = await screen.height();
  console.log(`Detected screen size: ${screenWidth}x${screenHeight}`);
}

const wss = new WebSocketServer({ port: PORT });
console.log(`Input helper listening on ws://localhost:${PORT}`);
console.log('Waiting for host.html to connect...');

init();

wss.on('connection', (ws) => {
  console.log('host.html connected — remote control is now live.');

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    try {
      switch (msg.type) {
        case 'mousemove': {
          const x = Math.round(msg.x * screenWidth);
          const y = Math.round(msg.y * screenHeight);
          await mouse.setPosition(new Point(x, y));
          break;
        }
        case 'mousedown':
          await mouse.pressButton(BUTTON_MAP[msg.button] ?? Button.LEFT);
          break;
        case 'mouseup':
          await mouse.releaseButton(BUTTON_MAP[msg.button] ?? Button.LEFT);
          break;
        case 'wheel':
          if (msg.deltaY > 0) await mouse.scrollDown(3);
          else await mouse.scrollUp(3);
          break;
        case 'keydown': {
          const k = mapKey(msg.key);
          if (k !== null) await keyboard.pressKey(k);
          break;
        }
        case 'keyup': {
          const k = mapKey(msg.key);
          if (k !== null) await keyboard.releaseKey(k);
          break;
        }
      }
    } catch (e) {
      console.warn('Input event failed:', e.message);
    }
  });

  ws.on('close', () => console.log('host.html disconnected — remote control paused.'));
});
