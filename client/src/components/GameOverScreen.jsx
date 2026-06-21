import { useEffect, useState } from 'react';
import { audio } from '../audio/AudioManager.js';

const MEDAL_ICONS  = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
const PODIUM_COLS  = ['#fbbf24', '#e2e8f0', '#cd7f32'];
const PODIUM_H     = [120, 90, 70];
// Display order: 2nd | 1st | 3rd
const PODIUM_ORDER = [1, 0, 2];

export default function GameOverScreen({ leaderboard = [], winner, onClose }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    audio.join();
    const t = setInterval(() => {
      setCountdown(p => {
        if (p <= 1) { clearInterval(t); onClose?.(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const top3 = leaderboard.slice(0, 3);

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.07) 0%, rgba(0,0,0,0.9) 100%)',
      zIndex: 95, animation: 'goIn 0.4s ease',
    }}>
      <div style={{
        background: 'rgba(4,8,20,0.97)',
        border: '1px solid rgba(251,191,36,0.2)',
        borderTop: '3px solid #fbbf24',
        borderRadius: 22, padding: '36px 44px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
        backdropFilter: 'blur(28px)',
        width: '100%', maxWidth: 500, textAlign: 'center',
        boxShadow: '0 0 80px rgba(251,191,36,0.06), 0 24px 60px rgba(0,0,0,0.6)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Header */}
        <div>
          <div style={{ fontSize: 52, animation: 'trophySpin 1.2s ease' }}>🏆</div>
          <div style={{
            fontSize: 30, fontWeight: 900, letterSpacing: 2, marginTop: 8,
            background: 'linear-gradient(135deg, #fbbf24, #f97316)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>ROUND OVER</div>
          {winner && (
            <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>
              <span style={{ color: '#fbbf24', fontWeight: 900 }}>{winner.name}</span>
              {' '}wins with{' '}
              <span style={{ color: '#22c55e', fontWeight: 800 }}>{winner.score}</span> points!
            </div>
          )}
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, justifyContent: 'center', width: '100%' }}>
            {PODIUM_ORDER.map((rank, vi) => {
              const p = top3[rank];
              if (!p) return <div key={vi} style={{ width: 110 }} />;
              return (
                <div key={rank} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 120 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 800, color: '#f1f5f9',
                    textAlign: 'center', wordBreak: 'break-word',
                  }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{p.score} pts</div>
                  <div style={{
                    width: '100%', height: PODIUM_H[rank],
                    background: `linear-gradient(180deg, ${PODIUM_COLS[rank]}20, ${PODIUM_COLS[rank]}08)`,
                    border: `1px solid ${PODIUM_COLS[rank]}44`,
                    borderBottom: 'none', borderRadius: '8px 8px 0 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32,
                  }}>
                    {MEDAL_ICONS[rank]}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard rows 4+ */}
        {leaderboard.length > 3 && (
          <div style={{ width: '100%', background: 'rgba(6,12,26,0.5)', borderRadius: 10, overflow: 'hidden' }}>
            {leaderboard.slice(3).map((p, i) => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 14px',
                borderBottom: i < leaderboard.length - 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}>
                <span style={{ fontSize: 11, color: '#334155', width: 26 }}>#{i + 4}</span>
                <span style={{ flex: 1, fontSize: 13, color: '#94a3b8', textAlign: 'left' }}>{p.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{p.score}</span>
              </div>
            ))}
          </div>
        )}

        {/* Countdown */}
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#475569', fontWeight: 700, marginBottom: 8 }}>
            NEW ROUND STARTING IN
          </div>
          <div style={{
            fontSize: 44, fontWeight: 900, color: '#00f5ff',
            fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 20px rgba(0,245,255,0.5)',
          }}>{countdown}</div>
          <div style={{ fontSize: 10, color: '#334155', marginTop: 8 }}>
            All players auto-respawn — get ready!
          </div>
        </div>
      </div>

      <style>{`
        @keyframes goIn      { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
        @keyframes trophySpin{ 0%{transform:rotate(-15deg) scale(0.5)} 60%{transform:rotate(5deg) scale(1.1)} 100%{transform:rotate(0deg) scale(1)} }
      `}</style>
    </div>
  );
}
