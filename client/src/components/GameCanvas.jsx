import { useRef, useEffect } from 'react';

const GRID_SIZE = 100;

// ─── Drawing helpers ──────────────────────────────────────────────────────────

function drawGrid(ctx, camX, camY, w, h, worldSize) {
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;

  const x0 = Math.floor((camX - w / 2) / GRID_SIZE) * GRID_SIZE;
  const y0 = Math.floor((camY - h / 2) / GRID_SIZE) * GRID_SIZE;

  ctx.beginPath();
  for (let x = x0; x < camX + w / 2 + GRID_SIZE; x += GRID_SIZE) {
    ctx.moveTo(x, camY - h / 2);
    ctx.lineTo(x, camY + h / 2);
  }
  for (let y = y0; y < camY + h / 2 + GRID_SIZE; y += GRID_SIZE) {
    ctx.moveTo(camX - w / 2, y);
    ctx.lineTo(camX + w / 2, y);
  }
  ctx.stroke();
}

function drawWorldBorder(ctx, worldSize) {
  ctx.strokeStyle = '#ff3355';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#ff3355';
  ctx.shadowBlur = 15;
  ctx.strokeRect(0, 0, worldSize, worldSize);
  ctx.shadowBlur = 0;
}

function drawPellets(ctx, pellets) {
  for (const [, x, y, hue] of pellets) {
    const r = 5;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `hsl(${hue},100%,85%)`);
    grd.addColorStop(1, `hsl(${hue},80%,50%)`);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }
}

function drawSnake(ctx, snake, isOwn) {
  const body = snake.body; // [[x,y], ...]
  if (!body || body.length === 0) return;

  const hw = isOwn ? 11 : 9;   // half-width of snake body

  // ── Body polyline ──
  if (body.length > 1) {
    // Outer glow for own snake
    if (isOwn) {
      ctx.beginPath();
      ctx.moveTo(snake.x, snake.y);
      for (const [bx, by] of body) ctx.lineTo(bx, by);
      ctx.strokeStyle = `${snake.color}55`;
      ctx.lineWidth = hw * 2 + 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Main body
    ctx.beginPath();
    ctx.moveTo(snake.x, snake.y);
    for (const [bx, by] of body) ctx.lineTo(bx, by);
    ctx.strokeStyle = snake.color;
    ctx.lineWidth = hw * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Darker spine
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = hw * 0.6;
    ctx.stroke();
  }

  // ── Head ──
  const headR = hw + 2;
  ctx.beginPath();
  ctx.arc(snake.x, snake.y, headR, 0, Math.PI * 2);
  ctx.fillStyle = snake.color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // ── Eyes ──
  const eyeDist = headR * 0.55;
  for (const offset of [-0.42, 0.42]) {
    const ea = snake.dir + offset;
    const ex = snake.x + Math.cos(ea) * eyeDist;
    const ey = snake.y + Math.sin(ea) * eyeDist;

    ctx.beginPath();
    ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      ex + Math.cos(snake.dir) * 1.2,
      ey + Math.sin(snake.dir) * 1.2,
      1.8, 0, Math.PI * 2,
    );
    ctx.fillStyle = '#111';
    ctx.fill();
  }

  // ── Boost particles ──
  if (snake.boosting) {
    const tail = body[body.length - 1];
    if (tail) {
      ctx.beginPath();
      ctx.arc(tail[0], tail[1], 6, 0, Math.PI * 2);
      ctx.fillStyle = `${snake.color}99`;
      ctx.fill();
    }
  }

  // ── Name tag ──
  const labelY = snake.y - headR - 10;
  ctx.font = isOwn ? 'bold 14px sans-serif' : '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(snake.name, snake.x + 1, labelY + 1);
  ctx.fillStyle = isOwn ? '#ffe566' : '#fff';
  ctx.fillText(snake.name, snake.x, labelY);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GameCanvas({ snapshot, playerId, onInput, active }) {
  const canvasRef = useRef(null);
  const snapshotRef = useRef(null);
  const playerIdRef = useRef(null);
  const boostRef = useRef(false);
  const rafRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { snapshotRef.current = snapshot; }, [snapshot]);
  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);

  // ─── Mouse / keyboard input ──────────────────────────────────────────────

  const keysRef = useRef(new Set());   // currently held direction keys
  const mouseDirRef = useRef(0);        // last direction from mouse

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Compute direction from currently held WASD / arrow keys.
    // Returns null if no direction key is held.
    const keyDir = () => {
      const k = keysRef.current;
      let dx = 0, dy = 0;
      if (k.has('ArrowUp')    || k.has('KeyW')) dy -= 1;
      if (k.has('ArrowDown')  || k.has('KeyS')) dy += 1;
      if (k.has('ArrowLeft')  || k.has('KeyA')) dx -= 1;
      if (k.has('ArrowRight') || k.has('KeyD')) dx += 1;
      if (dx === 0 && dy === 0) return null;
      return Math.atan2(dy, dx);
    };

    // Mouse move → update mouse direction reference
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left - canvas.width / 2;
      const my = e.clientY - rect.top - canvas.height / 2;
      mouseDirRef.current = Math.atan2(my, mx);
      // Mouse wins over keyboard while moving
      onInput(mouseDirRef.current, boostRef.current);
    };

    const onMouseDown = (e) => {
      if (e.button === 0) { boostRef.current = true; onInput(mouseDirRef.current, true); }
    };
    const onMouseUp = (e) => {
      if (e.button === 0) { boostRef.current = false; onInput(mouseDirRef.current, false); }
    };

    const onKeyDown = (e) => {
      const DIRECTION_KEYS = new Set([
        'ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
        'KeyW','KeyA','KeyS','KeyD',
      ]);
      if (DIRECTION_KEYS.has(e.code)) {
        e.preventDefault();
        keysRef.current.add(e.code);
        const d = keyDir();
        if (d !== null) onInput(d, boostRef.current);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        boostRef.current = true;
        onInput(keyDir() ?? mouseDirRef.current, true);
      }
    };

    const onKeyUp = (e) => {
      keysRef.current.delete(e.code);
      if (e.code === 'Space') {
        boostRef.current = false;
        onInput(keyDir() ?? mouseDirRef.current, false);
      }
      // Keep sending new direction if other keys still held
      const d = keyDir();
      if (d !== null) onInput(d, boostRef.current);
    };

    // Interval: continuously stream keyboard direction while keys held (30 Hz)
    const keyInterval = setInterval(() => {
      const d = keyDir();
      if (d !== null) onInput(d, boostRef.current);
    }, 33);

    // Throttle mousemove
    let lastMouseSend = 0;
    const throttledMouseMove = (e) => {
      const now = Date.now();
      if (now - lastMouseSend < 30) return;
      lastMouseSend = now;
      onMouseMove(e);
    };

    canvas.addEventListener('mousemove', throttledMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      clearInterval(keyInterval);
      canvas.removeEventListener('mousemove', throttledMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [active, onInput]);

  // ─── Render loop ─────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      rafRef.current = requestAnimationFrame(render);
      const snap = snapshotRef.current;

      if (!snap) {
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#555';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Connecting…', canvas.width / 2, canvas.height / 2);
        return;
      }

      // Find own snake
      const mySnake = snap.snakes.find(s => s.id === playerIdRef.current);
      const camX = mySnake ? mySnake.x : snap.worldSize / 2;
      const camY = mySnake ? mySnake.y : snap.worldSize / 2;
      const w = canvas.width;
      const h = canvas.height;

      // Background
      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2 - camX, h / 2 - camY);

      drawGrid(ctx, camX, camY, w, h, snap.worldSize);
      drawWorldBorder(ctx, snap.worldSize);
      drawPellets(ctx, snap.pellets);

      // Draw others first, then own snake on top
      for (const snake of snap.snakes) {
        if (snake.id !== playerIdRef.current) drawSnake(ctx, snake, false);
      }
      if (mySnake) drawSnake(ctx, mySnake, true);

      ctx.restore();

      // Mini-map
      drawMinimap(ctx, snap, mySnake, w, h);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', cursor: active ? 'none' : 'default' }}
    />
  );
}

// ─── Mini-map ─────────────────────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawMinimap(ctx, snap, mySnake, cw, ch) {
  const SIZE = 180;
  const PAD = 16;
  const R = 12;
  const mx = cw - SIZE - PAD;
  const my = ch - SIZE - PAD;
  const scale = SIZE / snap.worldSize;

  ctx.save();

  // Clip to rounded rect
  roundRect(ctx, mx, my, SIZE, SIZE, R);
  ctx.clip();

  // Dark background
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = 'rgba(4, 8, 24, 0.95)';
  ctx.fillRect(mx, my, SIZE, SIZE);

  // Subtle grid
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = '#00f5ff';
  ctx.lineWidth = 0.5;
  const step = SIZE / 4;
  ctx.beginPath();
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(mx + i * step, my);
    ctx.lineTo(mx + i * step, my + SIZE);
    ctx.moveTo(mx, my + i * step);
    ctx.lineTo(mx + SIZE, my + i * step);
  }
  ctx.stroke();

  // World border hint
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = '#ff3355';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx + 1, my + 1, SIZE - 2, SIZE - 2);

  // Pellets — colored dots
  ctx.globalAlpha = 0.65;
  for (const [, px, py, hue] of snap.pellets) {
    ctx.fillStyle = `hsl(${hue ?? 180},100%,72%)`;
    ctx.fillRect(mx + px * scale - 1, my + py * scale - 1, 2, 2);
  }

  // Other snakes
  ctx.globalAlpha = 0.9;
  for (const s of snap.snakes) {
    if (s.id === mySnake?.id) continue;
    const sx = mx + s.x * scale;
    const sy = my + s.y * scale;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.fill();
  }

  // Viewport rect (shows what the player can see)
  if (mySnake) {
    const vx = mx + (mySnake.x - cw / 2) * scale;
    const vy = my + (mySnake.y - ch / 2) * scale;
    const vw = cw * scale;
    const vh = ch * scale;
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#00f5ff';
    ctx.fillRect(vx, vy, vw, vh);
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#00f5ff';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(vx, vy, vw, vh);
  }

  // Own snake — glowing white dot + direction arrow
  if (mySnake) {
    const sx = mx + mySnake.x * scale;
    const sy = my + mySnake.y * scale;
    const dir = mySnake.dir ?? 0;

    // Glow halo
    ctx.globalAlpha = 0.35;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();

    // White dot
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Direction arrow
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.95;
    const arrowLen = 7;
    const arrowW = 2.5;
    const tip = { x: sx + Math.cos(dir) * (arrowLen + 4), y: sy + Math.sin(dir) * (arrowLen + 4) };
    const l   = { x: sx + Math.cos(dir + 2.5) * arrowW, y: sy + Math.sin(dir + 2.5) * arrowW };
    const r2  = { x: sx + Math.cos(dir - 2.5) * arrowW, y: sy + Math.sin(dir - 2.5) * arrowW };
    ctx.beginPath();
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(l.x, l.y);
    ctx.lineTo(r2.x, r2.y);
    ctx.closePath();
    ctx.fillStyle = '#00f5ff';
    ctx.fill();
  }

  ctx.restore();

  // Glowing border (drawn outside clip)
  ctx.save();
  ctx.shadowColor = '#00c8ff';
  ctx.shadowBlur = 12;
  ctx.strokeStyle = 'rgba(0, 200, 255, 0.85)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, mx, my, SIZE, SIZE, R);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // "MAP" label
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#00f5ff';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('MAP', mx + 9, my + 14);

  // Player count badge
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${snap.snakes.length}P`, mx + SIZE - 9, my + 14);

  ctx.restore();
}
