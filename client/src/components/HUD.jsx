import { useState, useEffect } from 'react';

const BASE = {
  position: 'absolute', top: 0, left: 0,
  width: '100%', height: '100%',
  pointerEvents: 'none', userSelect: 'none',
};

function GameTimer({ timeLeftMs }) {
  if (timeLeftMs === null || timeLeftMs === undefined) return null;
  const total  = Math.max(0, Math.ceil(timeLeftMs / 1000));
  const m      = Math.floor(total / 60);
  const s      = total % 60;
  const urgent = total <= 30;
  const warn   = total <= 60;
  return (
    <div style={{
      position: 'absolute', top: 14, left: '50%',
      transform: 'translateX(-50%)',
      background: urgent ? 'rgba(239,68,68,0.12)' : warn ? 'rgba(249,115,22,0.1)' : 'rgba(3,9,18,0.82)',
      border: `1px solid ${urgent ? 'rgba(239,68,68,0.4)' : warn ? 'rgba(249,115,22,0.3)' : 'rgba(0,200,255,0.1)'}`,
      borderRadius: 10, padding: '5px 18px',
      backdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      animation: urgent ? 'timerPulse 1s ease infinite' : 'none',
    }}>
      <div style={{ fontSize: 8, letterSpacing: 2.5, color: urgent ? '#fca5a5' : warn ? '#fdba74' : '#475569', fontWeight: 800 }}>ROUND</div>
      <div style={{
        fontSize: 20, fontWeight: 900, letterSpacing: 2,
        color: urgent ? '#ef4444' : warn ? '#f97316' : '#f1f5f9',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1.2,
      }}>{`${m}:${String(s).padStart(2, '0')}`}</div>
    </div>
  );
}

function Leaderboard({ leaderboard, playerId }) {
  const medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
  return (
    <div style={{
      position: 'absolute', top: 14, right: 14,
      background: 'rgba(3,9,18,0.84)', border: '1px solid rgba(0,200,255,0.1)',
      borderRadius: 12, padding: '12px 14px', minWidth: 190,
      backdropFilter: 'blur(16px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 3, color: '#334155', marginBottom: 10, textAlign: 'center' }}>LEADERBOARD</div>
      {leaderboard.length === 0 && <div style={{ color: '#334155', fontSize: 11, textAlign: 'center' }}>No players yet</div>}
      {leaderboard.map((e, i) => (
        <div key={e.id || i} style={{
          display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, marginBottom: 5,
          padding: '3px 6px', borderRadius: 6,
          background: e.id === playerId ? 'rgba(0,245,255,0.07)' : 'transparent',
          color: e.id === playerId ? '#00f5ff' : '#e2e8f0',
          fontWeight: e.id === playerId ? 800 : 400,
        }}>
          <span style={{ fontSize: 12, flexShrink: 0, width: 20, textAlign: 'center' }}>
            {i < 3 ? medals[i] : <span style={{ color: '#334155', fontSize: 10 }}>#{i + 1}</span>}
          </span>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
          <span style={{ color: i === 0 ? '#fbbf24' : '#475569', fontVariantNumeric: 'tabular-nums', fontSize: 13, fontWeight: 700 }}>{e.score}</span>
        </div>
      ))}
    </div>
  );
}

function Killfeed({ entries }) {
  return (
    <div style={{ position: 'absolute', bottom: 90, left: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
      {entries.map((e, i) => (
        <div key={e.key} style={{
          background: 'rgba(3,9,18,0.8)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, padding: '5px 12px', fontSize: 11,
          backdropFilter: 'blur(12px)', opacity: 1 - i * 0.15,
          animation: 'kfSlide 0.25s ease',
        }}>
          {e.killerName
            ? <><span style={{ color: '#f87171', fontWeight: 700 }}>{e.killerName}</span><span style={{ color: '#374151' }}> ⚡ </span><span style={{ color: '#93c5fd' }}>{e.victimName}</span><span style={{ color: '#334155' }}> +{e.length}</span></>
            : <><span style={{ color: '#93c5fd' }}>{e.victimName}</span><span style={{ color: '#374151' }}> hit the wall</span></>}
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ snapshot, playerId }) {
  const me = snapshot?.snakes?.find(s => s.id === playerId);
  if (!me) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(3,9,18,0.84)', border: '1px solid rgba(0,200,255,0.1)',
      borderRadius: 24, padding: '7px 24px', display: 'flex', gap: 22, alignItems: 'center',
      backdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    }}>
      <Pill label="LENGTH" value={me.length} color="#22c55e" />
      <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.06)' }} />
      <Pill label="SCORE"  value={me.score}  color="#fbbf24" />
      {me.boosting && <>
        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ fontSize: 12, fontWeight: 800, color: '#f97316', animation: 'boostGlow 0.5s ease infinite' }}>⚡ BOOST</div>
      </>}
    </div>
  );
}

function Pill({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 8, letterSpacing: 2.5, color: '#475569', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function RoomBadge({ roomCode }) {
  const [copied, setCopied] = useState(false);
  if (!roomCode) return null;
  const copy = () => { navigator.clipboard.writeText(roomCode).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div onClick={copy} title="Click to copy" style={{
      position: 'absolute', top: 14, left: 14,
      background: 'rgba(3,9,18,0.84)', border: '1px solid rgba(0,200,255,0.14)',
      borderRadius: 10, padding: '7px 16px', cursor: 'pointer',
      backdropFilter: 'blur(16px)', pointerEvents: 'all',
    }}>
      <div style={{ fontSize: 8, color: '#334155', letterSpacing: 2.5, fontWeight: 800 }}>ROOM</div>
      <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 5, color: copied ? '#22c55e' : '#00f5ff', transition: 'color 0.2s', fontFamily: 'monospace' }}>
        {copied ? '✓ COPIED' : roomCode}
      </div>
    </div>
  );
}

function Greeting({ text, onDismiss }) {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => { setVis(false); setTimeout(onDismiss, 500); }, 5500);
    return () => clearTimeout(t);
  }, []);
  if (!text) return null;
  return (
    <div style={{
      position: 'absolute', top: 70, left: '50%',
      transform: vis ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(-12px)',
      background: 'rgba(3,9,18,0.92)', border: '1px solid rgba(0,245,255,0.18)',
      borderRadius: 12, padding: '12px 22px', fontSize: 13, color: '#bae6fd',
      textAlign: 'center', maxWidth: 380, backdropFilter: 'blur(20px)',
      opacity: vis ? 1 : 0, transition: 'opacity 0.5s, transform 0.5s',
    }}>{text}</div>
  );
}

export default function HUD({ leaderboard, killfeed, snapshot, playerId, roomCode, greeting, onGreetingDismiss, timeLeftMs }) {
  return (
    <div style={BASE}>
      <RoomBadge roomCode={roomCode} />
      <GameTimer timeLeftMs={timeLeftMs} />
      <Leaderboard leaderboard={leaderboard} playerId={playerId} />
      <Killfeed entries={killfeed} />
      <ScoreBar snapshot={snapshot} playerId={playerId} />
      {greeting && <Greeting text={greeting} onDismiss={onGreetingDismiss} />}
      <div style={{ position: 'absolute', bottom: 14, right: 14, fontSize: 10, color: '#1e293b', textAlign: 'right', lineHeight: 1.9 }}>
        Steer: mouse / WASD / arrows<br />Boost: hold click / space
      </div>
      <style>{`
        @keyframes kfSlide    { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes boostGlow  { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes timerPulse { 0%,100%{box-shadow:none} 50%{box-shadow:0 0 14px rgba(239,68,68,0.4)} }
      `}</style>
    </div>
  );
}
