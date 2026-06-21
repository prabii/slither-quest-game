import { useState } from 'react';
import { audio } from '../audio/AudioManager.js';

const COLORS = [
  { id: 'emerald', label: 'Emerald', head: '#22c55e', body: '#16a34a' },
  { id: 'cobalt',  label: 'Cobalt',  head: '#3b82f6', body: '#2563eb' },
  { id: 'crimson', label: 'Crimson', head: '#ef4444', body: '#dc2626' },
  { id: 'amber',   label: 'Amber',   head: '#f59e0b', body: '#d97706' },
  { id: 'violet',  label: 'Violet',  head: '#a855f7', body: '#9333ea' },
  { id: 'cyber',   label: 'Cyber',   head: '#06b6d4', body: '#0891b2' },
  { id: 'rose',    label: 'Rose',    head: '#f43f5e', body: '#e11d48' },
  { id: 'venom',   label: 'Venom',   head: '#84cc16', body: '#65a30d' },
];

const EMOJIS = ['\uD83D\uDC0D', '\uD83D\uDC7E', '\uD83E\uDD16', '\uD83E\uDDA6', '\uD83D\uDC32', '\uD83E\uDD85', '\uD83D\uDC3A', '\uD83D\uDC80'];

const loadAvatar = () => {
  try { return JSON.parse(localStorage.getItem('sq_avatar') || '{"colorId":"emerald","emoji":"\uD83D\uDC0D"}'); }
  catch { return { colorId: 'emerald', emoji: '\uD83D\uDC0D' }; }
};

function Label({ children }) {
  return <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: '#475569' }}>{children}</div>;
}

function SnakePreview({ color, emoji }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {[40, 32, 26, 20, 16].map((size, i) => (
        <div key={i} style={{
          width: size, height: size,
          borderRadius: i === 0 ? '50%' : '40%',
          background: i === 0
            ? `radial-gradient(circle at 35% 35%, ${color.head}, ${color.body})`
            : color.body,
          display: i === 0 ? 'flex' : 'block',
          alignItems: 'center', justifyContent: 'center',
          fontSize: i === 0 ? 18 : 0,
          flexShrink: 0,
          opacity: 1 - i * 0.12,
          boxShadow: i === 0 ? `0 0 18px ${color.head}88` : 'none',
        }}>
          {i === 0 ? emoji : null}
        </div>
      ))}
    </div>
  );
}

function CredRow({ label, value, ok }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8,
    }}>
      <span style={{ fontSize: 10, letterSpacing: 1.5, color: '#475569', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 13, color: ok ? '#e2e8f0' : '#334155', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

export default function ArenaPanel({ playerName, pin }) {
  const [avatar, setAvatar] = useState(loadAvatar);

  const save = (next) => {
    setAvatar(next);
    audio.click();
    try { localStorage.setItem('sq_avatar', JSON.stringify(next)); } catch {}
  };

  const color = COLORS.find(c => c.id === avatar.colorId) || COLORS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* Snake preview */}
      <div style={{
        background: 'rgba(6,12,26,0.7)', border: '1px solid rgba(0,200,255,0.1)',
        borderRadius: 16, padding: '22px 24px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <SnakePreview color={color} emoji={avatar.emoji} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
            {avatar.emoji} {playerName || 'Your Snake'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{color.label} skin</div>
          {playerName && (
            <div style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 8, padding: '3px 10px',
              fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: 1,
            }}>
              {'\u2713'} Credentials active
            </div>
          )}
        </div>
      </div>

      {/* Color picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Label>SNAKE SKIN</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COLORS.map(c => (
            <button key={c.id} title={c.label} onClick={() => save({ ...avatar, colorId: c.id })}
              style={{
                width: 44, height: 44, borderRadius: 12, cursor: 'pointer',
                background: `linear-gradient(135deg, ${c.head}, ${c.body})`,
                border: avatar.colorId === c.id ? '3px solid #fff' : '3px solid transparent',
                boxShadow: avatar.colorId === c.id ? `0 0 16px ${c.head}cc` : 'none',
                transition: 'all 0.2s', outline: 'none',
              }} />
          ))}
        </div>
      </div>

      {/* Emoji picker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Label>AVATAR ICON</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => save({ ...avatar, emoji: e })}
              style={{
                fontSize: 22, padding: '8px 10px',
                background: avatar.emoji === e ? 'rgba(0,200,255,0.12)' : 'rgba(255,255,255,0.04)',
                border: avatar.emoji === e ? '1px solid rgba(0,200,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, cursor: 'pointer',
                boxShadow: avatar.emoji === e ? '0 0 12px rgba(0,200,255,0.25)' : 'none',
                transition: 'all 0.2s', outline: 'none',
              }}>{e}</button>
          ))}
        </div>
      </div>

      {/* Credentials */}
      <div style={{
        background: 'rgba(6,12,26,0.6)', border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <Label>PLAYER CREDENTIALS</Label>
        <CredRow label="Name" value={playerName || '-- enter in PLAY tab'} ok={!!playerName} />
        <CredRow label="PIN"  value={pin ? '\u2022\u2022\u2022\u2022' : '-- enter in PLAY tab'} ok={!!pin} />
        <div style={{ fontSize: 10, color: '#1e293b', lineHeight: 1.7, marginTop: 4 }}>
          PIN protects your identity across sessions. First use registers, return use verifies.
        </div>
      </div>

      {/* Active rooms notice */}
      <div style={{
        background: 'rgba(168,85,247,0.04)', border: '1px dashed rgba(168,85,247,0.15)',
        borderRadius: 12, padding: '20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>🔭</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>Open Room Browser</div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>
          Browse and join open rooms directly from the{' '}
          <span style={{ color: '#00f5ff', fontWeight: 700 }}>JOIN ROOM</span> tab
        </div>
      </div>
    </div>
  );
}
