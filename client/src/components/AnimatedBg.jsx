import { useEffect, useRef } from 'react';

// ── Config ────────────────────────────────────────────────────────────────────
const SNAKE_COUNT  = 7;
const PREY_COUNT   = 11;
const SNAKE_SPEED  = 1.15;
const BODY_LEN     = 26;
const TURN_RATE    = 0.048;
const SNAKE_HUES   = [160, 200, 280, 35, 110, 340, 190];

function rnd(a, b) { return a + Math.random() * (b - a); }

export default function AnimatedBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, raf, t = 0;

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Particles (rising) ────────────────────────────────────────────────────
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random(), y: Math.random(),
      r: rnd(0.5, 2.5),
      vy: -(rnd(0.00012, 0.00035)),
      hue: Math.random() < 0.5 ? rnd(170, 210) : rnd(260, 290),
      a: rnd(0.1, 0.45),
    }));

    // ── Prey (glowing food dots) ───────────────────────────────────────────────
    const prey = Array.from({ length: PREY_COUNT }, (_, i) => ({
      x: rnd(80, window.innerWidth - 80),
      y: rnd(80, window.innerHeight - 80),
      hue: i * 33,
      alive: true,
      respawnIn: 0,
      phase: rnd(0, Math.PI * 2),
      wx: rnd(0, Math.PI * 2), // wander angle x
      wy: rnd(0, Math.PI * 2), // wander angle y
    }));

    // ── Snakes ────────────────────────────────────────────────────────────────
    const snakes = Array.from({ length: SNAKE_COUNT }, (_, i) => {
      const sx = rnd(120, window.innerWidth - 120);
      const sy = rnd(120, window.innerHeight - 120);
      const ang = rnd(0, Math.PI * 2);
      return {
        x: sx, y: sy, angle: ang,
        body: Array.from({ length: BODY_LEN }, (_, j) => [
          sx - Math.cos(ang) * j * 7,
          sy - Math.sin(ang) * j * 7,
        ]),
        hue: SNAKE_HUES[i % SNAKE_HUES.length],
        targetIdx: i % PREY_COUNT,
        wander: ang,
      };
    });

    // ── Main loop ─────────────────────────────────────────────────────────────
    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.007;

      // ── Background ──
      const rg = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.85);
      rg.addColorStop(0, '#0a1228');
      rg.addColorStop(0.5, '#060914');
      rg.addColorStop(1, '#03060f');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);

      // ── Neon block grid (wave-animated) ──
      const COLS = 14, ROWS = 9;
      const cw = W / COLS, ch = H / ROWS;
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          const wave  = Math.sin(t * 0.9 + c * 0.55 + r * 1.0) * 0.5 + 0.5;
          const bright= Math.sin(t * 0.3 + c * 0.4 - r * 0.7) * 0.5 + 0.5;
          const hue   = 185 + c * 4 + r * 2;
          ctx.strokeStyle = `hsla(${hue},85%,65%,${wave * 0.065 + 0.01})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
          if (Math.sin(t * 0.55 + c * 1.7 + r * 2.3) > 0.94) {
            ctx.fillStyle = `hsla(${hue},90%,70%,${bright * 0.045})`;
            ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
          }
        }
      }

      // Faint grid lines
      ctx.strokeStyle = 'rgba(0,200,255,0.02)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, H); ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(W, r * ch); ctx.stroke();
      }

      // ── Rising particles ──
      for (const p of particles) {
        p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        const fade = p.a * (1 - Math.abs(p.y - 0.5) * 1.5);
        if (fade <= 0) continue;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,78%,${fade})`;
        ctx.fill();
      }

      // ── Prey ──
      prey.forEach((p) => {
        if (!p.alive) {
          p.respawnIn--;
          if (p.respawnIn <= 0) {
            p.x = rnd(60, W - 60);
            p.y = rnd(60, H - 60);
            p.alive = true;
            p.hue = rnd(0, 360);
            p.wx = rnd(0, Math.PI * 2);
            p.wy = rnd(0, Math.PI * 2);
          }
          return;
        }
        p.phase += 0.045;
        p.wx += (Math.random() - 0.5) * 0.025;
        p.wy += (Math.random() - 0.5) * 0.025;
        p.x += Math.cos(p.wx) * 0.45;
        p.y += Math.sin(p.wy) * 0.45;
        p.x = Math.max(30, Math.min(W - 30, p.x));
        p.y = Math.max(30, Math.min(H - 30, p.y));

        const pulse = 0.5 + 0.5 * Math.sin(p.phase);
        const gr    = 3 + pulse * 1.8;

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr * 5);
        grd.addColorStop(0, `hsla(${p.hue},100%,78%,0.65)`);
        grd.addColorStop(0.4, `hsla(${p.hue},100%,60%,0.2)`);
        grd.addColorStop(1, `hsla(${p.hue},100%,40%,0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, gr * 5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, gr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,90%,${0.8 + pulse * 0.2})`;
        ctx.fill();
      });

      // ── Snakes ──
      snakes.forEach(s => {
        // Find alive target
        let tgt = prey[s.targetIdx];
        if (!tgt?.alive) {
          const ni = prey.findIndex(p => p.alive);
          if (ni >= 0) { s.targetIdx = ni; tgt = prey[ni]; }
        }

        if (tgt?.alive) {
          const dx = tgt.x - s.x, dy = tgt.y - s.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 12) {
            tgt.alive = false;
            tgt.respawnIn = 110;
            const ni = prey.findIndex((p, i) => i !== s.targetIdx && p.alive);
            if (ni >= 0) s.targetIdx = ni;
          } else {
            let ta = Math.atan2(dy, dx);
            let diff = ta - s.angle;
            while (diff >  Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            s.angle += Math.sign(diff) * Math.min(Math.abs(diff), TURN_RATE);
          }
        } else {
          s.wander += (Math.random() - 0.5) * 0.07;
          s.angle  += (s.wander - s.angle) * 0.04;
        }

        s.x += Math.cos(s.angle) * SNAKE_SPEED;
        s.y += Math.sin(s.angle) * SNAKE_SPEED;
        if (s.x < -40) s.x = W + 40;
        if (s.x > W + 40) s.x = -40;
        if (s.y < -40) s.y = H + 40;
        if (s.y > H + 40) s.y = -40;

        s.body.unshift([s.x, s.y]);
        if (s.body.length > BODY_LEN) s.body.length = BODY_LEN;

        // Body segments (back-to-front so head is on top)
        for (let j = s.body.length - 1; j >= 0; j--) {
          const [bx, by] = s.body[j];
          const frac = 1 - j / s.body.length;
          const r = 1.5 + frac * 4.5;
          const a = 0.06 + frac * 0.42;
          ctx.beginPath();
          ctx.arc(bx, by, r, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue},80%,60%,${a})`;
          ctx.fill();
        }

        // Head with glow
        ctx.shadowColor = `hsl(${s.hue},100%,65%)`;
        ctx.shadowBlur  = 12;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${s.hue},100%,78%)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // ── Diagonal light sweep ──
      ctx.save();
      ctx.globalAlpha = 0.018 + Math.sin(t * 0.3) * 0.006;
      const ray = ctx.createLinearGradient(0, 0, W, H);
      ray.addColorStop(0, 'transparent');
      ray.addColorStop(0.5, '#00e8ff');
      ray.addColorStop(1, 'transparent');
      ctx.fillStyle = ray;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // ── Vignette ──
      const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.65);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
    };

    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}
