'use strict';

require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { GameEngine } = require('./game');
const { BreethClient } = require('./breeth');

const PORT = parseInt(process.env.PORT || '3001', 10);
const TICK_MS = 1000 / 25; // 25 ticks/sec → 40 ms
const ROOM_PASSWORD = process.env.ROOM_PASSWORD || null; // null = no password required

// ─── Express + WebSocket ─────────────────────────────────────────────────────

const path = require('path');
const app = express();
app.use(express.json());
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// Serve built client (npm run build in /client → /client/dist)
app.use(express.static(path.join(__dirname, '../client/dist')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, perMessageDeflate: true });

// ─── Valkey (ioredis) ────────────────────────────────────────────────────────

let valkey = null;
let valkeyPub = null; // for publish
let valkeySub = null; // for subscribe (separate connection required by Redis protocol)

const VALKEY_URL = process.env.VALKEY_URL;

if (VALKEY_URL) {
  const Redis = require('ioredis');
  const makeClient = () => new Redis(VALKEY_URL, {
    tls: VALKEY_URL.startsWith('rediss://') ? {} : undefined,
    lazyConnect: false,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 500, 2000);
    },
  });

  valkey = makeClient();
  valkeyPub = makeClient();
  valkeySub = makeClient();

  valkey.on('error', e => console.warn('[Valkey] main:', e.message));
  valkeyPub.on('error', e => console.warn('[Valkey] pub:', e.message));
  valkeySub.on('error', e => console.warn('[Valkey] sub:', e.message));

  valkeySub.subscribe('game:events', err => {
    if (err) console.warn('[Valkey] subscribe error:', err.message);
  });

  valkeySub.on('message', (_channel, raw) => {
    // Relay kill-feed events from Valkey to all WebSocket clients
    try {
      const event = JSON.parse(raw);
      _broadcastKillfeed(event);
    } catch (_) {}
  });

  console.log('[Valkey] connecting…');
} else {
  console.warn('[Valkey] VALKEY_URL not set – running without persistence');
}

// ─── Breeth ──────────────────────────────────────────────────────────────────

const breeth = new BreethClient(process.env.BREETH_API_KEY);

// ─── Game state ──────────────────────────────────────────────────────────────

const game = new GameEngine();
const clients = new Map();  // clientId → WebSocket
const players = new Map();  // clientId → { name }

let leaderboard = [];       // cached top-10, updated every 2 s

// ─── Helpers ─────────────────────────────────────────────────────────────────

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const ws of clients.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}

function _broadcastKillfeed(event) {
  broadcast({ type: 'killfeed', data: event });
}

// ─── Death handler ───────────────────────────────────────────────────────────

async function handleDeath(event) {
  // Notify the dead player directly
  const ws = clients.get(event.victimId);
  if (ws) send(ws, { type: 'death', data: event });

  // Publish to Valkey → subscriber relays to all as killfeed
  if (valkeyPub) {
    try {
      await valkeyPub.publish('game:events', JSON.stringify(event));
    } catch (_) {
      // Fallback: broadcast directly if Valkey is down
      _broadcastKillfeed(event);
    }
  } else {
    _broadcastKillfeed(event);
  }

  // Breeth: remember this death
  const player = players.get(event.victimId);
  if (player) {
    breeth.rememberDeath(player.name, event.length, event.killerName).catch(() => {});
  }
}

// ─── Valkey persistence (2×/sec) ─────────────────────────────────────────────

let lastPersist = 0;

async function persistToValkey(snapshot) {
  if (!valkey) return;
  try {
    const pipe = valkey.pipeline();
    // Update leaderboard sorted set
    for (const s of snapshot.snakes) {
      pipe.zadd('game:leaderboard', s.score, s.id);
      pipe.hset('game:names', s.id, s.name);
    }
    // World snapshot with 5-second TTL
    pipe.set('game:world', JSON.stringify(snapshot), 'EX', 5);
    await pipe.exec();

    // Read top-10 for HUD
    const raw = await valkey.zrevrange('game:leaderboard', 0, 9, 'WITHSCORES');
    const lb = [];
    for (let i = 0; i < raw.length; i += 2) {
      const id = raw[i];
      const score = parseInt(raw[i + 1], 10);
      const name = await valkey.hget('game:names', id);
      lb.push({ id, name: name || 'Unknown', score });
    }
    leaderboard = lb;
  } catch (err) {
    console.warn('[Valkey] persist error:', err.message);
  }
}

// Fallback leaderboard from live snakes when Valkey is unavailable
function computeLeaderboard(snapshot) {
  return snapshot.snakes
    .slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(s => ({ id: s.id, name: s.name, score: s.score }));
}

// ─── Game loop ───────────────────────────────────────────────────────────────

setInterval(async () => {
  const events = game.tick();
  const snapshot = game.getSnapshot();
  const now = Date.now();

  // Handle deaths
  for (const ev of events) {
    if (ev.type === 'death') handleDeath(ev).catch(() => {});
  }

  // Persist & update leaderboard every 2 s
  if (now - lastPersist >= 2000) {
    lastPersist = now;
    if (valkey) {
      persistToValkey(snapshot).catch(() => {});
    } else {
      leaderboard = computeLeaderboard(snapshot);
    }
  }

  // Broadcast snapshot + leaderboard to every connected client
  const msg = JSON.stringify({ type: 'snapshot', data: snapshot, leaderboard });
  for (const ws of clients.values()) {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  }
}, TICK_MS);

// ─── WebSocket connections ───────────────────────────────────────────────────

wss.on('connection', ws => {
  const clientId = uuidv4();
  clients.set(clientId, ws);

  ws.on('message', async raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      // Password check (if ROOM_PASSWORD is set)
      if (ROOM_PASSWORD && msg.password !== ROOM_PASSWORD) {
        send(ws, { type: 'error', code: 'wrong_password', message: 'Wrong room password.' });
        return;
      }

      const name = String(msg.name || 'Anonymous').slice(0, 20).trim() || 'Anonymous';
      players.set(clientId, { name });

      // Recall Breeth memory (non-blocking)
      let greeting = null;
      try { greeting = await breeth.recallPlayer(name); } catch (_) {}

      // Add snake
      game.addSnake(clientId, name);

      // Announce join in Valkey
      if (valkeyPub) {
        valkeyPub.publish('game:events', JSON.stringify({ type: 'join', name })).catch(() => {});
      }
      if (valkey) {
        valkey.hset('game:names', clientId, name).catch(() => {});
      }

      send(ws, { type: 'joined', id: clientId, greeting });
      return;
    }

    if (msg.type === 'input') {
      const dir = typeof msg.dir === 'number' ? msg.dir : 0;
      const boost = !!msg.boost;
      game.setInput(clientId, { dir, boost });
      return;
    }

    if (msg.type === 'respawn') {
      const player = players.get(clientId);
      if (player) {
        game.addSnake(clientId, player.name);
        send(ws, { type: 'respawned', id: clientId });
      }
      return;
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    players.delete(clientId);
    game.removeSnake(clientId);
  });

  ws.on('error', () => {
    clients.delete(clientId);
    players.delete(clientId);
    game.removeSnake(clientId);
  });
});

// ─── REST endpoints ───────────────────────────────────────────────────────────

app.get('/api/leaderboard', async (_req, res) => {
  res.json(leaderboard);
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    players: clients.size,
    snakes: game.snakes.size,
    valkey: !!valkey,
    breeth: breeth.enabled,
    passwordRequired: !!ROOM_PASSWORD,
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`[Server] listening on ws://localhost:${PORT}`);
  console.log(`[Server] Valkey: ${VALKEY_URL ? 'connected' : 'disabled'}`);
  console.log(`[Server] Breeth: ${breeth.enabled ? 'enabled' : 'fallback'}`);
});
