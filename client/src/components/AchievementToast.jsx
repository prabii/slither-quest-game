import { useEffect, useState } from 'react';
import { audio } from '../audio/AudioManager.js';

function Toast({ a, onDone }) {
  const [alive, setAlive] = useState(true);

  useEffect(() => {
    audio.achievement();
    const t1 = setTimeout(() => setAlive(false), 4200);
    const t2 = setTimeout(onDone, 4700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'rgba(4,8,20,0.97)',
      border: `1px solid ${a.color}44`,
      borderLeft: `4px solid ${a.color}`,
      borderRadius: 12,
      padding: '14px 20px',
      backdropFilter: 'blur(28px)',
      boxShadow: `0 0 32px ${a.glow}, 0 8px 32px rgba(0,0,0,0.6)`,
      minWidth: 280, maxWidth: 340,
      opacity: alive ? 1 : 0,
      transform: alive ? 'translateX(0)' : 'translateX(48px)',
      transition: 'opacity 0.45s ease, transform 0.45s ease',
    }}>
      <span style={{ fontSize: 32, lineHeight: 1, flexShrink: 0 }}>{a.icon}</span>
      <div>
        <div style={{ fontSize: 9, letterSpacing: 3, color: a.color, fontWeight: 800, marginBottom: 3 }}>
          ACHIEVEMENT UNLOCKED
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9' }}>{a.name}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{a.desc}</div>
      </div>
    </div>
  );
}

export default function AchievementToast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 90, right: 18, zIndex: 9999,
      display: 'flex', flexDirection: 'column-reverse', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(a => (
        <Toast key={a.key} a={a} onDone={() => onDismiss(a.key)} />
      ))}
    </div>
  );
}
