import { useState, useEffect, useCallback } from 'react';
import AnimatedBg from './AnimatedBg.jsx';
import ProfilePanel from './ProfilePanel.jsx';
import ArenaPanel from './ArenaPanel.jsx';
import HallOfFame from './HallOfFame.jsx';
import { audio } from '../audio/AudioManager.js';

// Derive HTTP base from WS env var for API calls
const HTTP_BASE = (() => {
  const ws = import.meta.env.VITE_WS_URL || '';
  if (ws) return ws.replace('wss://', 'https://').replace('ws://', 'http://');
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
})();

const SECTIONS = [
  { id: 'play',    label: 'PLAY',         icon: '\u25B6\uFE0F' },
  { id: 'profile', label: 'PROFILE',      icon: '\uD83D\uDC64' },
  { id: 'arena',   label: 'ARENA',        icon: '\uD83C\uDFA8' },
  { id: 'hall',    label: 'HALL OF FAME', icon: '\uD83C\uDFC6' },
];

// ── Design tokens ─────────────────────────────────────────────────────────────

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10, padding: '12px 16px',
  color: '#f1f5f9', fontSize: 15,
  outline: 'none', width: '100%',
  transition: 'border-color 0.2s',
  fontFamily: 'inherit',
};

// ── Shared components ─────────────────────────────────────────────────────────

function FInput({ label, hint, style: extra, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ width: '100%' }}>
      {label && (
        <div style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 3, marginBottom: 7,
          color: focused ? '#00f5ff' : '#475569', transition: 'color 0.2s',
        }}>{label}</div>
      )}
      <input
        style={{ ...inputStyle, borderColor: focused ? 'rgba(0,245,255,0.35)' : 'rgba(255,255,255,0.09)', ...extra }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {hint && <div style={{ fontSize: 10, color: '#374151', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function Btn({ children, onClick, disabled, accent = '#00f5ff', secondary = false }) {
  return (
    <button
      onClick={() => { if (!disabled) { audio.click(); onClick?.(); } }}
      disabled={disabled}
      style={{
        width: '100%', padding: '13px',
        borderRadius: 10,
        fontWeight: 800, fontSize: 13, letterSpacing: 1.5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        background: disabled
          ? 'rgba(255,255,255,0.05)'
          : secondary
            ? `rgba(0,200,255,0.08)`
            : `linear-gradient(135deg, ${accent}, ${accent === '#00f5ff' ? '#0ea5e9' : '#9333ea'})`,
        color: disabled ? '#334155' : secondary ? accent : (accent === '#00f5ff' ? '#030912' : '#fff'),
        boxShadow: disabled || secondary ? 'none' : `0 0 22px ${accent}44`,
        border: secondary ? `1px solid ${accent}44` : 'none',
      }}
    >{children}</button>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{
      background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 8, padding: '10px 14px',
      color: '#fca5a5', fontSize: 12, textAlign: 'center',
    }}>{msg}</div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />;
}

// ── Create Tab ────────────────────────────────────────────────────────────────

function CreateTab({ onCreate, error, loading, createdCode, onCopyCode }) {
  const savedName = () => { try { return localStorage.getItem('sq_last_name') || ''; } catch { return ''; } };
  const [name, setName]     = useState(savedName);
  const [pin, setPin]       = useState('');
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
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12, letterSpacing: 1 }}>
          SHARE THIS CODE WITH FRIENDS
        </div>
        <div style={{
          fontSize: 52, fontWeight: 900, letterSpacing: 10,
          background: 'linear-gradient(135deg, #00f5ff, #a855f7)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 18,
        }}>{createdCode}</div>
        <button onClick={onCopyCode} style={{
          background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)',
          borderRadius: 8, padding: '8px 22px', color: '#00f5ff',
          fontSize: 11, fontWeight: 800, cursor: 'pointer', letterSpacing: 2,
        }}>COPY CODE</button>
        <div style={{ marginTop: 14, fontSize: 11, color: '#374151' }}>Entering arena&hellip;</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ErrBox msg={error} />
      <FInput label="YOUR NAME" placeholder="e.g. VenomKing" maxLength={20}
        value={name} onChange={e => setName(e.target.value)} autoFocus />
      <FInput label="4-DIGIT PIN" type="password" placeholder="\u2022\u2022\u2022\u2022" maxLength={4}
        hint="PIN locks your identity across sessions"
        style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }}
        value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))} />
      <FInput label="ROOM PASSWORD (optional)" type="password"
        placeholder="Leave blank for public room" maxLength={30}
        value={roomPw} onChange={e => setRoomPw(e.target.value)} />
      <Btn disabled={!ready || loading}>{loading ? 'Creating\u2026' : 'CREATE ROOM \u2192'}</Btn>
    </form>
  );
}

// ── Open Rooms Browser ────────────────────────────────────────────────────────

function fmtTimeLeft(ms) {
  if (!ms || ms <= 0) return 'N/A';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function OpenRoomsBrowser({ onSelectRoom }) {
  const [rooms, setRooms]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`${HTTP_BASE}/api/rooms`);
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not reach server');
      setRooms([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 9, letterSpacing: 3, color: '#475569', fontWeight: 800 }}>OPEN ROOMS</div>
        <button onClick={fetch_} style={{
          background: 'transparent', border: 'none', color: '#00f5ff', fontSize: 11,
          cursor: 'pointer', fontWeight: 700, letterSpacing: 1,
        }}>{loading ? '\u21BB' : '\u21BB Refresh'}</button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#475569', fontSize: 12 }}>
          Scanning rooms\u2026
        </div>
      )}
      {error && <div style={{ fontSize: 11, color: '#ef4444', textAlign: 'center' }}>{error}</div>}

      {!loading && rooms !== null && rooms.length === 0 && (
        <div style={{
          padding: '20px', textAlign: 'center',
          background: 'rgba(6,12,26,0.5)', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.04)',
        }}>
          <div style={{ fontSize: 22, marginBottom: 6 }}>'\uD83C\uDF0C'</div>
          <div style={{ fontSize: 12, color: '#475569' }}>No open rooms right now</div>
          <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>Create one and invite friends!</div>
        </div>
      )}

      {!loading && rooms && rooms.map(r => (
        <button key={r.code} onClick={() => { audio.click(); onSelectRoom(r.code); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(0,200,255,0.04)', border: '1px solid rgba(0,200,255,0.12)',
            borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
            transition: 'all 0.2s', textAlign: 'left', width: '100%',
          }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 4, color: '#00f5ff', fontFamily: 'monospace' }}>
              {r.code}
            </div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
              {r.players} {r.players === 1 ? 'player' : 'players'} &bull; {r.passwordRequired ? '\uD83D\uDD12 Private' : '\uD83D\uDD13 Open'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 700 }}>
              {fmtTimeLeft(r.timeLeftMs)} left
            </div>
            <div style={{ fontSize: 9, color: '#334155', marginTop: 2 }}>JOIN \u2192</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ── Join Tab ──────────────────────────────────────────────────────────────────

function JoinTab({ onJoin, onCheckRoom, error, loading }) {
  const savedName = () => { try { return localStorage.getItem('sq_last_name') || ''; } catch { return ''; } };
  const [mode, setMode]     = useState('code'); // 'code' | 'browse'
  const [code, setCode]     = useState('');
  const [name, setName]     = useState(savedName);
  const [pin, setPin]       = useState('');
  const [roomPw, setRoomPw] = useState('');
  const [info, setInfo]     = useState(null);
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

  const tabBtn = (id, label) => (
    <button onClick={() => { setMode(id); audio.navSwitch(); }}
      style={{
        flex: 1, padding: '7px', border: 'none', borderRadius: 7, cursor: 'pointer',
        fontWeight: 700, fontSize: 10, letterSpacing: 1.5, transition: 'all 0.2s',
        background: mode === id ? 'rgba(0,200,255,0.12)' : 'transparent',
        color: mode === id ? '#00f5ff' : '#475569',
        borderBottom: mode === id ? '2px solid #00f5ff' : '2px solid transparent',
      }}>{label}</button>
  );

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ErrBox msg={error} />

      {/* Code / Browse toggle */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(8,16,32,0.6)', borderRadius: 8, padding: 3 }}>
        {tabBtn('code',   'ENTER CODE')}
        {tabBtn('browse', 'BROWSE ROOMS')}
      </div>

      {mode === 'browse' ? (
        <OpenRoomsBrowser onSelectRoom={(c) => { setCode(c); setMode('code'); }} />
      ) : (
        <>
          {/* Code input */}
          <div style={{ width: '100%' }}>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: '#475569', marginBottom: 7 }}>ROOM CODE</div>
            <input autoFocus maxLength={4} placeholder="X X X X"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4))}
              style={{ ...inputStyle, letterSpacing: 10, textAlign: 'center', fontSize: 26, fontWeight: 900 }}
            />
            {code.length === 4 && (
              <div style={{
                fontSize: 11, marginTop: 6,
                color: info ? (info.exists ? '#22c55e' : '#ef4444') : '#475569',
              }}>
                {checking ? '\u23F3 Checking\u2026'
                  : info?.exists
                    ? (info.passwordRequired ? '\uD83D\uDD12 Room found \u2014 password required' : '\u2705 Room found \u2014 join below')
                    : '\u2717 Room not found'}
              </div>
            )}
          </div>
        </>
      )}

      {/* Player fields (always shown) */}
      {mode === 'code' && (
        <>
          <FInput label="YOUR NAME" placeholder="e.g. VenomKing" maxLength={20}
            value={name} onChange={e => setName(e.target.value)} />
          <FInput label="YOUR PIN" type="password" placeholder="\u2022\u2022\u2022\u2022" maxLength={4}
            style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }}
            value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))} />
          {info?.passwordRequired && (
            <FInput label="ROOM PASSWORD" type="password"
              placeholder="Enter room password" maxLength={30}
              value={roomPw} onChange={e => setRoomPw(e.target.value)} />
          )}
          <Btn disabled={!ready || loading} accent="#a855f7">
            {loading ? 'Joining\u2026' : 'JOIN ROOM \u2192'}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {!createdCode && (
        <div style={{ display: 'flex', gap: 4, background: 'rgba(8,16,32,0.7)', borderRadius: 10, padding: 4 }}>
          {['create', 'join'].map(id => (
            <button key={id} onClick={() => { setSub(id); audio.navSwitch(); }}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontWeight: 800, fontSize: 11, letterSpacing: 2, transition: 'all 0.2s',
                background: sub === id ? 'rgba(0,245,255,0.1)' : 'transparent',
                color: sub === id ? '#00f5ff' : '#475569',
                borderBottom: sub === id ? '2px solid #00f5ff' : '2px solid transparent',
              }}>
              {id === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
            </button>
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

      <div style={{ textAlign: 'center', fontSize: 10, color: '#1e293b', lineHeight: 2, letterSpacing: 0.5 }}>
        Steer: mouse / WASD / arrows &nbsp;&bull;&nbsp; Boost: hold click or space
        &nbsp;&bull;&nbsp; 5-min rounds
      </div>
    </div>
  );
}

// ── Panel wrapper ─────────────────────────────────────────────────────────────

function Panel({ children }) {
  return (
    <div style={{
      background: 'rgba(4,9,22,0.9)',
      border: '1px solid rgba(0,200,255,0.1)',
      borderRadius: 18, padding: '30px 32px',
      backdropFilter: 'blur(24px)',
      boxShadow: '0 0 60px rgba(0,100,255,0.05), 0 24px 60px rgba(0,0,0,0.4)',
    }}>
      {children}
    </div>
  );
}

// ── Main Lobby ────────────────────────────────────────────────────────────────

export default function LobbyScreen({
  onCreate, onJoin, onCheckRoom,
  error, loading, createdCode,
  stats, unlocked, playerName, pin,
}) {
  const [section, setSection] = useState('play');
  const [muted,   setMuted]   = useState(false);

  const switchSection = (id) => { audio.navSwitch(); audio.resume(); setSection(id); };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    audio.setMuted(next);
    audio.click();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <AnimatedBg />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* ── Top bar ── */}
        <header style={{
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
          borderBottom: '1px solid rgba(0,200,255,0.07)',
          backdropFilter: 'blur(12px)',
          background: 'rgba(2,5,14,0.6)',
          flexShrink: 0,
          flexWrap: 'wrap',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 8 }}>
            <span style={{ fontSize: 26 }}>🐍</span>
            <div>
              <div style={{
                fontSize: 18, fontWeight: 900, letterSpacing: -0.5,
                background: 'linear-gradient(135deg, #00f5ff, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>SLITHER QUEST</div>
              <div style={{ fontSize: 9, color: '#334155', letterSpacing: 2 }}>EAT &bull; GROW &bull; OUTLAST</div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 2, flex: 1, justifyContent: 'center' }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => switchSection(s.id)}
                style={{
                  padding: '7px 14px', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 700, fontSize: 10, letterSpacing: 1.5,
                  transition: 'all 0.2s',
                  background: section === s.id ? 'rgba(0,245,255,0.1)' : 'transparent',
                  color: section === s.id ? '#00f5ff' : '#475569',
                  borderBottom: section === s.id ? '2px solid #00f5ff' : '2px solid transparent',
                }}>
                {s.icon} {s.label}
              </button>
            ))}
          </nav>

          {/* Mute toggle */}
          <button onClick={toggleMute}
            style={{
              background: muted ? 'rgba(239,68,68,0.1)' : 'rgba(0,245,255,0.07)',
              border: muted ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(0,245,255,0.15)',
              borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
              color: muted ? '#ef4444' : '#00f5ff', fontSize: 16, transition: 'all 0.2s',
            }}
            title={muted ? 'Unmute' : 'Mute'}
          >{muted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}</button>
        </header>

        {/* ── Content ── */}
        <main style={{
          flex: 1, overflowY: 'auto',
          display: 'flex', justifyContent: 'center',
          padding: '28px 16px 48px',
        }}>
          <div style={{ width: '100%', maxWidth: section === 'play' ? 430 : 650 }}>
            {section === 'play' && (
              <Panel>
                <PlaySection onCreate={onCreate} onJoin={onJoin} onCheckRoom={onCheckRoom}
                  error={error} loading={loading} createdCode={createdCode} />
              </Panel>
            )}
            {section === 'profile' && <ProfilePanel stats={stats} unlocked={unlocked} />}
            {section === 'arena'   && <ArenaPanel playerName={playerName} pin={pin} />}
            {section === 'hall'    && <HallOfFame stats={stats} />}
          </div>
        </main>
      </div>

      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,200,255,0.15); border-radius: 4px; }
      `}</style>
    </div>
  );
}
