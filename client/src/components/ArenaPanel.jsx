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

const EMOJIS = ['🐍', '👾', '🤖', '🦦', '🐲', '🦅', '🐺', '💀'];

const loadAvatar = () => {
  try { return JSON.parse(localStorage.getItem('sq_avatar') || '{"colorId":"emerald","emoji":"🐍"}'); }
  catch { return { colorId: 'emerald', emoji: '🐍' }; }
};

const loadCredentials = () => ({
  name: (() => { try { return localStorage.getItem('sq_last_name') || ''; } catch { return ''; } })(),
  pin:  (() => { try { return localStorage.getItem('sq_last_pin')  || ''; } catch { return ''; } })(),
});

function Label({ children }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: 3, fontWeight: 800, color: '#475569', marginBottom: 8 }}>
      {children}
    </div>
  );
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

export default function ArenaPanel() {
  const [avatar, setAvatar]   = useState(loadAvatar);
  const creds                  = loadCredentials();
  const [credName, setCredName] = useState(creds.name);
  const [credPin,  setCredPin]  = useState(creds.pin);
  const [saved, setSaved]       = useState(false);

  const color = COLORS.find(c => c.id === avatar.colorId) || COLORS[0];

  const saveAvatar = (next) => {
    setAvatar(next);
    audio.click();
    try { localStorage.setItem('sq_avatar', JSON.stringify(next)); } catch {}
  };

  const saveCredentials = () => {
    try {
      if (credName.trim()) localStorage.setItem('sq_last_name', credName.trim());
      if (credPin.length === 4) localStorage.setItem('sq_last_pin', credPin);
    } catch {}
    audio.click();
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const credReady = credName.trim().length >= 2 && credPin.length === 4;

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '11px 14px',
    color: '#f1f5f9', fontSize: 14,
    outline: 'none', width: '100%',
    fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

      {/* ── Snake preview ── */}
      <div style={{
        background: 'rgba(6,12,26,0.7)', border: '1px solid rgba(0,200,255,0.1)',
        borderRadius: 16, padding: '22px 24px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <SnakePreview color={color} emoji={avatar.emoji} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>
            {avatar.emoji} {credName || 'Your Snake'}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{color.label} skin</div>
          {credName && credPin.length === 4 && (
            <div style={{
              marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 8, padding: '3px 10px',
              fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: 1,
            }}>✓ Credentials set</div>
          )}
        </div>
      </div>

      {/* ── Player Credentials (editable) ── */}
      <div style={{
        background: 'rgba(6,12,26,0.7)',
        border: '1px solid rgba(0,245,255,0.12)',
        borderTop: '2px solid rgba(0,212,170,0.5)',
        borderRadius: 14, padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ fontSize: 10, letterSpacing: 3, fontWeight: 800, color: '#00f5ff' }}>
          PLAYER CREDENTIALS
        </div>
        <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.7 }}>
          Set your name and PIN here — they'll auto-fill when you create or join a room.
        </div>

        {/* Name */}
        <div>
          <Label>YOUR NAME</Label>
          <input
            style={inputStyle}
            placeholder="e.g. VenomKing"
            maxLength={20}
            value={credName}
            onChange={e => setCredName(e.target.value)}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,245,255,0.35)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
        </div>

        {/* PIN */}
        <div>
          <Label>4-DIGIT PIN</Label>
          <input
            style={{ ...inputStyle, letterSpacing: 8, textAlign: 'center', fontSize: 22 }}
            type="password"
            inputMode="numeric"
            placeholder="••••"
            maxLength={4}
            value={credPin}
            onChange={e => setCredPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,245,255,0.35)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          />
          <div style={{ fontSize: 9, color: '#334155', marginTop: 5 }}>
            PIN locks your identity across sessions. First use registers, return use verifies.
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={saveCredentials}
          disabled={!credReady}
          style={{
            width: '100%', padding: '12px',
            borderRadius: 10, border: 'none',
            fontWeight: 800, fontSize: 12, letterSpacing: 1.5,
            cursor: credReady ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            background: saved
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : credReady
                ? 'linear-gradient(135deg, #00f5ff, #0ea5e9)'
                : 'rgba(255,255,255,0.05)',
            color: saved ? '#fff' : credReady ? '#030912' : '#334155',
            boxShadow: saved
              ? '0 0 22px rgba(34,197,94,0.4)'
              : credReady ? '0 0 22px rgba(0,245,255,0.35)' : 'none',
            transition: 'all 0.3s',
          }}
        >
          {saved ? '✓ CREDENTIALS SAVED' : 'SAVE CREDENTIALS'}
        </button>
      </div>

      {/* ── Color picker ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Label>SNAKE SKIN</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COLORS.map(c => (
            <button key={c.id} title={c.label} onClick={() => saveAvatar({ ...avatar, colorId: c.id })}
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

      {/* ── Emoji picker ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Label>AVATAR ICON</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => saveAvatar({ ...avatar, emoji: e })}
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

      {/* ── Room browser notice ── */}
      <div style={{
        background: 'rgba(168,85,247,0.04)', border: '1px dashed rgba(168,85,247,0.15)',
        borderRadius: 12, padding: '18px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 24, marginBottom: 6 }}>🔭</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>Open Room Browser</div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 5 }}>
          Browse and join open rooms from the{' '}
          <span style={{ color: '#00f5ff', fontWeight: 700 }}>JOIN ROOM</span> tab
        </div>
      </div>
    </div>
  );
}
