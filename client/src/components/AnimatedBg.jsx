import { useEffect, useRef } from 'react';

export default function AnimatedBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, t = 0;

    const COLS = 14, ROWS = 9, N_PARTICLES = 60;

    const particles = Array.from({ length: N_PARTICLES }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 2.5 + 0.5,
      vy: -(Math.random() * 0.00035 + 0.0001),
      hue: Math.random() < 0.5 ? 170 + Math.random() * 40 : 260 + Math.random() * 30,
      a: Math.random() * 0.5 + 0.1,
    }));

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      t += 0.008;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Deep space radial bg
      const rg = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.max(W, H) * 0.8);
      rg.addColorStop(0, '#0d1b42');
      rg.addColorStop(0.55, '#060e22');
      rg.addColorStop(1, '#020810');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);

      // Neon block grid
      const cw = W / COLS, ch = H / ROWS;
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          const wave   = Math.sin(t * 0.8 + c * 0.6 + r * 1.1) * 0.5 + 0.5;
          const bright = Math.sin(t * 0.3 + c * 0.4 - r * 0.7) * 0.5 + 0.5;
          const hue    = 185 + c * 4 + r * 2;
          ctx.strokeStyle = `hsla(${hue},85%,65%,${wave * 0.07 + 0.012})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);

          // Occasional glowing fill block
          if (Math.sin(t * 0.5 + c * 1.7 + r * 2.3) > 0.93) {
            ctx.fillStyle = `hsla(${hue},90%,70%,${bright * 0.055})`;
            ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
          }
        }
      }

      // Faint grid lines
      ctx.strokeStyle = 'rgba(0,200,255,0.025)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath(); ctx.moveTo(c * cw, 0); ctx.lineTo(c * cw, H); ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath(); ctx.moveTo(0, r * ch); ctx.lineTo(W, r * ch); ctx.stroke();
      }

      // Rising particles
      for (const p of particles) {
        p.y += p.vy;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        const fade = p.a * (1 - Math.abs(p.y - 0.5) * 1.6);
        if (fade <= 0) continue;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},100%,78%,${fade})`;
        ctx.fill();
      }

      // Diagonal light sweep
      ctx.save();
      ctx.globalAlpha = 0.022 + Math.sin(t * 0.35) * 0.008;
      const ray = ctx.createLinearGradient(0, 0, W, H);
      ray.addColorStop(0, 'transparent');
      ray.addColorStop(0.5, '#00e8ff');
      ray.addColorStop(1, 'transparent');
      ctx.fillStyle = ray;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.65);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}
