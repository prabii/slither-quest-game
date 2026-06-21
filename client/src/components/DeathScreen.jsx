import { useEffect, useState, useRef } from 'react';
import { audio } from '../audio/AudioManager.js';

export default function DeathScreen({ info, onRespawn, sessionStats }) {
  const [countdown, setCountdown] = useState(3);
  const played = useRef(false);

  useEffect(() => {
    setCountdown(3);
    played.current = false;
  }, [info]);

  useEffect(() => {
    if (!played.current) { audio.die(); played.current = true; }
    const t = setInterval(() => {
      setCountdown(p => { if (p <= 1) { clearInterval(t); return 0; } return p - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [info]);

  const ready   = countdown === 0;
  const fmtTime = s => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

  // SVG countdown ring
  const R = 22, CIRC = 2 * Math.PI * R;
  const dash = ready ? CIRC : CIRC * (1 - countdown / 3);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(239,68,68,0.07) 0%, rgba(0,0,0,0.84) 100%)',
      zIndex: 90, animation: 'dsIn 0.35s ease',
    }}>
      <div style={{
        background: 'rgba(4,8,20,0.97)',
        border: '1px solid rgba(239,68,68,0.18)',
        borderTop: '2px solid #ef4444',
        borderRadius: 20, padding: '40px 48px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        backdropFilter: 'blur(28px)', minWidth: 340, textAlign: 'center',
        boxShadow: '0 0 60px rgba(239,68,68,0.07), 0 24px 60px rgba(0,0,0,0.5)',
      }}>

        {/* Skull */}
        <div style={{ fontSize: 52, animation: 'skullShake 0.6s ease' }}>💀</div>

        {/* Title */}
        <div style={{
          fontSize: 34, fontWeight: 900, letterSpacing: 3,
          background: 'linear-gradient(135deg, #ef4444, #f97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>YOU DIED</div>

        {/* Cause */}
        {info && (
          <div style={{
            background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
            borderRadius: 10, padding: '12px 20px', fontSize: 13, color: '#94a3b8', lineHeight: 2,
          }}>
            {info.killerName
              ? <div>Devoured by <span style={{ color: '#f87171', fontWeight: 800 }}>{info.killerName}</span></div>
              : <div style={{ color: '#fca5a5' }}>Crashed into the wall</div>}
            {info.length > 0 && <div>Length reached <span style={{ color: '#4ade80', fontWeight: 800 }}>{info.length}</span></div>}
            {info.score  > 0 && <div>Score <span style={{ color: '#fbbf24', fontWeight: 800 }}>{info.score}</span></div>}
          </div>
        )}

        {/* Session stats chips */}
        {sessionStats && (sessionStats.kills > 0 || sessionStats.survivalSec > 0) && (
          <div style={{ display: 'flex', gap: 18 }}>
            {sessionStats.kills > 0 && <StatChip label="KILLS" val={sessionStats.kills} color="#ef4444" />}
            {sessionStats.survivalSec > 0 && <StatChip label="SURVIVED" val={fmtTime(sessionStats.survivalSec)} color="#a855f7" />}
          </div>
        )}

        {/* Countdown ring + respawn button */}
        <div style={{ position: 'relative', width: '100%' }}>
          {!ready && (
            <div style={{
              position: 'absolute', top: -52, left: '50%', transform: 'translateX(-50%)',
              width: 50, height: 50,
            }}>
              <svg width="50" height="50" viewBox="0 0 50 50" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="25" cy="25" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle cx="25" cy="25" r={R} fill="none" stroke="#00f5ff" strokeWidth="3"
                  strokeDasharray={`${dash} ${CIRC}`} style={{ transition: 'stroke-dasharray 1s linear' }} />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 900, color: '#00f5ff',
              }}>{countdown}</div>
            </div>
          )}
          <button onClick={ready ? onRespawn : undefined} style={{
            width: '100%', padding: '14px',
            border: 'none', borderRadius: 12,
            fontWeight: 800, fontSize: 14, letterSpacing: 1.5,
            cursor: ready ? 'pointer' : 'not-allowed',
            background: ready
              ? 'linear-gradient(135deg, #00f5ff, #0ea5e9)'
              : 'rgba(255,255,255,0.05)',
            color: ready ? '#030912' : '#334155',
            boxShadow: ready ? '0 0 24px rgba(0,245,255,0.3)' : 'none',
            transition: 'all 0.3s',
          }}>
            {ready ? 'RESPAWN →' : `Respawning in ${countdown}…`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dsIn       { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
        @keyframes skullShake { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-8deg)} 75%{transform:rotate(8deg)} }
      `}</style>
    </div>
  );
}

function StatChip({ label, val, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 8, letterSpacing: 2.5, color: '#475569', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{val}</div>
    </div>
  );
}
