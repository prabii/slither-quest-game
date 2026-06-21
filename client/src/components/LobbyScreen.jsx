import { useState, useEffect, useCallback } from 'react';
import AnimatedBg from './AnimatedBg.jsx';
import ProfilePanel from './ProfilePanel.jsx';
import ArenaPanel from './ArenaPanel.jsx';
import HallOfFame from './HallOfFame.jsx';
import { audio } from '../audio/AudioManager.js';

const HTTP_BASE = (() => {
  const ws = import.meta.env.VITE_WS_URL || '';
  if (ws) return ws.replace('wss://', 'https://').replace('ws://', 'http://');
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
})();

// ── Design system ─────────────────────────────────────────────────────────────
const T = {
  teal:       '#00d4aa',
  tealGlow:   'rgba(0,212,170,0.25)',
  tealDim:    'rgba(0,212,170,0.12)',
  tealBorder: 'rgba(0,212,170,0.28)',
  blue:       '#38bdf8',
  purple:     '#a78bfa',
  panel:      'rgba(8,13,30,0.96)',
  input:      'rgba(4,8,20,0.9)',
  glass:      'rgba(10,16,34,0.85)',
  border:     'rgba(255,255,255,0.07)',
  text:       '#e8f4ff',
  muted:      '#4a6080',
  faint:      '#1e2d42',
};

const FONT = "'Space Grotesk','Inter',system-ui,sans-serif";

const SECTIONS = [
  { id: 'play',    label: 'PLAY',         icon: '▶' },
  { id: 'arena',   label: 'ARENA',        icon: '🎮' },
  { id: 'profile', label: 'PROFILE',      icon: '👤' },
  { id: 'hall',    label: 'HALL OF FAME', icon: '🏆' },
];

// ── Base input style ──────────────────────────────────────────────────────────
const INPUT = {
  background: T.input,
  border: `1px solid ${T.border}`,
  borderRadius: 10, padding: '12px 16px',
  color: T.text, fontSize: 15,
  outline: 'none', width: '100%',
  fontFamily: FONT, boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

// ── Shared atoms ──────────────────────────────────────────────────────────────

function Label({ children, color }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 3,
      color: color || T.teal, marginBottom: 8,
    }}>{children}</div>
  );
}

function FInput({ label, hint, style: extra, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ width: '100%' }}>
      {label && <Label>{label}</Label>}
      <input
        style={{
          ...INPUT,
          borderColor: focused ? T.tealBorder : T.border,
          boxShadow: focused ? `0 0 0 3px ${T.tealDim}` : 'none',
          ...extra,
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {hint && (
        <div style={{ fontSize: 10, color: T.faint, marginTop: 5, lineHeight: 1.5 }}>{hint}</div>
      )}
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = 'primary', small = false }) {
  const variants = {
    primary: {
      background: disabled
        ? 'rgba(255,255,255,0.06)'
        : `linear-gradient(135deg, ${T.teal} 0%, #00b0e0 100%)`,
      color: disabled ? T.muted : '#040e18',
      boxShadow: disabled ? 'none' : `0 0 28px ${T.tealGlow}`,
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: T.muted,
      boxShadow: 'none',
      border: `1px solid ${T.border}`,
    },
    ghost: {
      background: T.tealDim,
      color: T.teal,
      boxShadow: 'none',
      border: `1px solid ${T.tealBorder}`,
    },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      onClick={() => { if (!disabled) { audio.click(); onClick?.(); } }}
      disabled={disabled}
      style={{
        width: '100%',
        padding: small ? '9px 16px' : '13px',
        borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 800, fontSize: small ? 11 : 13,
        letterSpacing: 1.5, fontFamily: FONT,
        transition: 'all 0.2s',
        ...v,
      }}
    >{children}</button>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.22)',
      borderRadius: 8, padding: '10px 14px',
      color: '#fca5a5', fontSize: 12, textAlign: 'center',
    }}>{msg}</div>
  );
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
      <div style={{ flex: 1, height: 1, background: T.border }} />
      {label && <span style={{ fontSize: 9, letterSpacing: 2, color: T.faint, fontWeight: 700 }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: T.border }} />
    </div>
  );
}

// ── Create Tab ────────────────────────────────────────────────────────────────

function CreateTab({ onCreate, error, loading, createdCode, onCopyCode }) {
  const savedName = () => { try { return localStorage.getItem('sq_last_name') || ''; } catch { return ''; } };
  const savedPin  = () => { try { return localStorage.getItem('sq_last_pin')  || ''; } catch { return ''; } };
  const [name,   setName]   = useState(savedName);
  const [pin,    setPin]    = useState(savedPin);
  const [roomPw, setRoomPw] = useState('');
  const ready = name.trim().length >= 2 && pin.length === 4;

  const submit = (e) => {
    e.preventDefault();
    if (!ready || loading) return;
    try { localStorage.setItem('sq_last_name', name.trim()); } catch {}
    onCreate(name.trim(), pin, roomPw.trim() || null);
  };

  if (createdCode) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 10, color: T.muted, marginBottom: 14, letterSpacing: 2 }}>
          SHARE THIS CODE WITH FRIENDS
        </div>
        <div style={{
          fontSize: 56, fontWeight: 900, letterSpacing: 12,
          background: `linear-gradient(135deg, ${T.teal}, ${T.blue})`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 20, textShadow: 'none',
        }}>{createdCode}</div>
        <button onClick={onCopyCode} style={{
          background: T.tealDim, border: `1px solid ${T.tealBorder}`,
          borderRadius: 8, padding: '9px 24px', color: T.teal,
          fontSize: 11, fontWeight: 800, cursor: 'pointer',
          letterSpacing: 2, fontFamily: FONT,
        }}>COPY CODE</button>
        <div style={{ marginTop: 16, fontSize: 11, color: T.faint }}>Entering arena…</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ErrBox msg={error} />
      <FInput label="YOUR NAME" placeholder="e.g. VenomKing" maxLength={20}
        value={name} onChange={e => setName(e.target.value)} autoFocus />
      <FInput label="4-DIGIT PIN" type="password" placeholder="••••" maxLength={4}
        hint="PIN locks your identity across sessions"
        style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }}
        value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
      <FInput label="ROOM PASSWORD (OPTIONAL)" type="password"
        placeholder="Leave blank for public room" maxLength={30}
        value={roomPw} onChange={e => setRoomPw(e.target.value)} />
      <Btn disabled={!ready || loading}>
        {loading ? 'Creating…' : 'CREATE ROOM →'}
      </Btn>
    </form>
  );
}

// ── Open Rooms Browser ────────────────────────────────────────────────────────

function fmtLeft(ms) {
  if (!ms || ms <= 0) return 'N/A';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function OpenRoomsBrowser({ onSelectRoom }) {
  const [rooms,   setRooms]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetch(`${HTTP_BASE}/api/rooms`).then(r => r.json());
      setRooms(Array.isArray(data) ? data : []);
    } catch { setError('Could not reach server'); setRooms([]); }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>OPEN ROOMS</Label>
        <button onClick={refresh} style={{
          background: 'transparent', border: 'none',
          color: T.teal, fontSize: 11, cursor: 'pointer',
          fontWeight: 700, fontFamily: FONT, letterSpacing: 1,
        }}>{loading ? '↻' : '↻ Refresh'}</button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: T.muted, fontSize: 12 }}>
          Scanning rooms…
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: '#ef4444', textAlign: 'center' }}>{error}</div>}

      {!loading && rooms?.length === 0 && (
        <div style={{
          padding: '24px', textAlign: 'center',
          background: T.glass, borderRadius: 10, border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🌌</div>
          <div style={{ fontSize: 12, color: T.muted }}>No open rooms right now</div>
          <div style={{ fontSize: 10, color: T.faint, marginTop: 4 }}>Create one and invite friends!</div>
        </div>
      )}

      {!loading && rooms?.map(r => (
        <button key={r.code} onClick={() => { audio.click(); onSelectRoom(r.code); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: T.tealDim, border: `1px solid ${T.tealBorder}`,
            borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
            transition: 'all 0.18s', textAlign: 'left',
            width: '100%', fontFamily: FONT,
          }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 4, color: T.teal, fontFamily: 'monospace' }}>
              {r.code}
            </div>
            <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>
              {r.players} {r.players === 1 ? 'player' : 'players'} · {r.passwordRequired ? '🔒 Private' : '🔓 Open'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>{fmtLeft(r.timeLeftMs)} left</div>
            <div style={{ fontSize: 9, color: T.faint, marginTop: 2 }}>JOIN →</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Join Tab ──────────────────────────────────────────────────────────────────

function JoinTab({ onJoin, onCheckRoom, error, loading }) {
  const savedName = () => { try { return localStorage.getItem('sq_last_name') || ''; } catch { return ''; } };
  const savedPin  = () => { try { return localStorage.getItem('sq_last_pin')  || ''; } catch { return ''; } };
  const [mode,     setMode]     = useState('code');
  const [code,     setCode]     = useState('');
  const [name,     setName]     = useState(savedName);
  const [pin,      setPin]      = useState(savedPin);
  const [roomPw,   setRoomPw]   = useState('');
  const [info,     setInfo]     = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (code.length === 4) {
      setChecking(true);
      onCheckRoom(code).then(r => { setInfo(r); setChecking(false); });
    } else { setInfo(null); }
  }, [code]);

  const ready = code.length === 4 && name.trim().length >= 2 && pin.length === 4
    && info?.exists && (!info?.passwordRequired || roomPw.length > 0);

  const submit = (e) => {
    e.preventDefault();
    if (!ready || loading) return;
    try { localStorage.setItem('sq_last_name', name.trim()); } catch {}
    onJoin(code, name.trim(), pin, roomPw.trim() || '');
  };

  const ModeBtn = ({ id, label }) => (
    <button onClick={() => { setMode(id); audio.navSwitch(); }} style={{
      flex: 1, padding: '9px', borderRadius: 8, cursor: 'pointer',
      fontWeight: 700, fontSize: 10, letterSpacing: 1.5,
      fontFamily: FONT, transition: 'all 0.18s',
      background: mode === id ? T.tealDim : 'transparent',
      color: mode === id ? T.teal : T.muted,
      border: mode === id ? `1px solid ${T.tealBorder}` : '1px solid transparent',
    }}>{label}</button>
  );

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ErrBox msg={error} />
      <div style={{ display: 'flex', gap: 4, background: T.input, borderRadius: 10, padding: 4 }}>
        <ModeBtn id="code"   label="ENTER CODE" />
        <ModeBtn id="browse" label="BROWSE ROOMS" />
      </div>

      {mode === 'browse' ? (
        <OpenRoomsBrowser onSelectRoom={c => { setCode(c); setMode('code'); }} />
      ) : (
        <div>
          <Label>ROOM CODE</Label>
          <input autoFocus maxLength={4} placeholder="X X X X" value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
            style={{ ...INPUT, letterSpacing: 12, textAlign: 'center', fontSize: 28, fontWeight: 900 }}
          />
          {code.length === 4 && (
            <div style={{
              fontSize: 11, marginTop: 7,
              color: info ? (info.exists ? '#22c55e' : '#ef4444') : T.muted,
            }}>
              {checking ? '⏳ Checking…'
                : info?.exists
                  ? (info.passwordRequired ? '🔒 Room found — password required' : '✅ Room found — join below')
                  : '✗ Room not found'}
            </div>
          )}
        </div>
      )}

      {mode === 'code' && (
        <>
          <FInput label="YOUR NAME" placeholder="e.g. VenomKing" maxLength={20}
            value={name} onChange={e => setName(e.target.value)} />
          <FInput label="YOUR PIN" type="password" placeholder="••••" maxLength={4}
            style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }}
            value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
          {info?.passwordRequired && (
            <FInput label="ROOM PASSWORD" type="password"
              placeholder="Enter room password" maxLength={30}
              value={roomPw} onChange={e => setRoomPw(e.target.value)} />
          )}
          <Btn disabled={!ready || loading} variant="primary">
            {loading ? 'Joining…' : 'JOIN ROOM →'}
          </Btn>
        </>
      )}
    </form>
  );
}

// ── Play Section ──────────────────────────────────────────────────────────────

function PlaySection({ onCreate, onJoin, onCheckRoom, error, loading, createdCode }) {
  const [sub, setSub] = useState('create');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Pill badge */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: T.tealDim, border: `1px solid ${T.tealBorder}`,
          borderRadius: 20, padding: '5px 16px',
          fontSize: 9, fontWeight: 800, letterSpacing: 2, color: T.teal,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.teal, display: 'inline-block', animation: 'pulse 2s infinite' }} />
          5-MIN ROUNDS · REAL-TIME · MULTIPLAYER
        </div>
      </div>

      {/* Create / Join switcher */}
      {!createdCode && (
        <div style={{
          display: 'flex', background: T.input,
          borderRadius: 12, padding: 4, gap: 4,
        }}>
          {[['create', '⊕ CREATE ROOM'], ['join', '→ JOIN ROOM']].map(([id, label]) => (
            <button key={id} onClick={() => { setSub(id); audio.navSwitch(); }}
              style={{
                flex: 1, padding: '11px', borderRadius: 9,
                fontWeight: 800, fontSize: 11, letterSpacing: 1.5,
                cursor: 'pointer', fontFamily: FONT, transition: 'all 0.18s',
                background: sub === id
                  ? `linear-gradient(135deg, ${T.teal}, #00a8d8)`
                  : 'transparent',
                color: sub === id ? '#030f18' : T.muted,
                border: 'none',
                boxShadow: sub === id ? `0 0 20px ${T.tealGlow}` : 'none',
              }}>{label}</button>
          ))}
        </div>
      )}

      {(sub === 'create' || createdCode) && (
        <CreateTab onCreate={onCreate} error={sub === 'create' ? error : null}
          loading={loading && sub === 'create'} createdCode={createdCode}
          onCopyCode={() => { navigator.clipboard.writeText(createdCode).catch(() => {}); audio.click(); }} />
      )}
      {sub === 'join' && !createdCode && (
        <JoinTab onJoin={onJoin} onCheckRoom={onCheckRoom} error={error} loading={loading} />
      )}

      <div style={{
        textAlign: 'center', fontSize: 10, color: T.faint,
        lineHeight: 2, borderTop: `1px solid ${T.border}`, paddingTop: 14,
      }}>
        Steer: mouse / WASD / arrows &nbsp;·&nbsp; Boost: hold click or space
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, sub, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: `linear-gradient(135deg, ${color || T.teal}20, ${color || T.teal}08)`,
        border: `1px solid ${color || T.teal}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
        boxShadow: `0 0 20px ${color || T.teal}18`,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 900, color: T.text, letterSpacing: 0.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 10, color: T.muted, letterSpacing: 1.2, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ── Glass panel ───────────────────────────────────────────────────────────────

function Panel({ children }) {
  return (
    <div style={{
      background: T.panel,
      border: `1px solid rgba(0,212,170,0.14)`,
      borderTop: `2px solid ${T.teal}`,
      borderRadius: 20, padding: '32px 36px',
      backdropFilter: 'blur(32px)',
      boxShadow: `0 0 80px rgba(0,0,0,0.6), 0 0 40px ${T.tealGlow}10`,
    }}>
      {children}
    </div>
  );
}

// ── Main lobby ────────────────────────────────────────────────────────────────

export default function LobbyScreen({
  onCreate, onJoin, onCheckRoom,
  error, loading, createdCode,
  stats, unlocked,
}) {
  const [section, setSection] = useState('play');
  const [muted,   setMuted]   = useState(false);

  const go = (id) => { audio.navSwitch(); audio.resume(); setSection(id); };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
    audio.click();
  };

  const sectionTitle = {
    play:    ['⚔️',  'Enter the Arena',    'Create a room or join an existing one', T.teal],
    arena:   ['🎨',  'Player Arena',       'Set your credentials, skin & avatar',   T.purple],
    profile: ['👤',  'Player Profile',     'Your stats and achievements',           '#fbbf24'],
    hall:    ['🏆',  'Hall of Fame',       'Your personal records',                 '#fbbf24'],
  };

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', flexDirection: 'column',
      fontFamily: FONT,
      background: '#06091a',
    }}>
      <AnimatedBg />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ════ Navbar ════ */}
        <nav style={{
          height: 56,
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 12,
          background: 'rgba(4,7,18,0.82)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(0,212,170,0.1)',
          flexShrink: 0,
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, #00d4aa1a, #00b0ff18)',
              border: `1.5px solid ${T.tealBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
              boxShadow: `0 0 14px ${T.tealGlow}`,
            }}>🐍</div>
            <span style={{
              fontSize: 16, fontWeight: 900, letterSpacing: 0.5,
              background: `linear-gradient(135deg, ${T.teal}, ${T.blue})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              whiteSpace: 'nowrap',
            }}>SLITHER QUEST</span>
          </div>

          {/* Center nav */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
            {SECTIONS.map(s => {
              const active = section === s.id;
              return (
                <button key={s.id} onClick={() => go(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 8,
                    cursor: 'pointer', fontWeight: 700,
                    fontSize: 11, letterSpacing: 1.2,
                    fontFamily: FONT, transition: 'all 0.18s',
                    background: active ? T.tealDim : 'transparent',
                    color: active ? T.teal : T.muted,
                    border: active ? `1px solid ${T.tealBorder}` : '1px solid transparent',
                    boxShadow: active ? `0 0 12px ${T.tealGlow}` : 'none',
                  }}>
                  <span style={{ fontSize: 13 }}>{s.icon}</span>
                  {s.label}
                </button>
              );
            })}
          </div>

          {/* Mute */}
          <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'}
            style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: muted ? 'rgba(239,68,68,0.1)' : T.tealDim,
              border: `1px solid ${muted ? 'rgba(239,68,68,0.3)' : T.tealBorder}`,
              cursor: 'pointer', fontSize: 16, transition: 'all 0.2s',
              flexShrink: 0,
            }}
          >{muted ? '🔇' : '🔊'}</button>
        </nav>

        {/* ════ Content ════ */}
        <main style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          padding: '36px 16px 60px',
        }}>
          <div style={{ width: '100%', maxWidth: section === 'play' ? 460 : 680 }}>
            {section === 'play' && (
              <Panel>
                <SectionHeader
                  icon={sectionTitle.play[0]}
                  title={sectionTitle.play[1]}
                  sub={sectionTitle.play[2]}
                  color={T.teal}
                />
                <PlaySection
                  onCreate={onCreate} onJoin={onJoin} onCheckRoom={onCheckRoom}
                  error={error} loading={loading} createdCode={createdCode}
                />
              </Panel>
            )}

            {section === 'arena' && (
              <Panel>
                <SectionHeader
                  icon={sectionTitle.arena[0]}
                  title={sectionTitle.arena[1]}
                  sub={sectionTitle.arena[2]}
                  color={T.purple}
                />
                <ArenaPanel />
              </Panel>
            )}

            {section === 'profile' && (
              <Panel>
                <SectionHeader
                  icon={sectionTitle.profile[0]}
                  title={sectionTitle.profile[1]}
                  sub={sectionTitle.profile[2]}
                  color="#fbbf24"
                />
                <ProfilePanel stats={stats} unlocked={unlocked} />
              </Panel>
            )}

            {section === 'hall' && (
              <Panel>
                <SectionHeader
                  icon={sectionTitle.hall[0]}
                  title={sectionTitle.hall[1]}
                  sub={sectionTitle.hall[2]}
                  color="#fbbf24"
                />
                <HallOfFame stats={stats} />
              </Panel>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.tealBorder}; border-radius: 4px; }

        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 ${T.tealGlow}; }
          50%       { opacity: 0.6; box-shadow: 0 0 0 4px transparent; }
        }

        button:not(:disabled):hover {
          filter: brightness(1.08);
        }
      `}</style>
    </div>
  );
}
