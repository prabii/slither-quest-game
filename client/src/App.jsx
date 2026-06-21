import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import HUD from './components/HUD.jsx';
import JoinScreen from './components/JoinScreen.jsx';
import DeathScreen from './components/DeathScreen.jsx';

// Auto-detect server from current page URL so one build works behind any tunnel
const WS_URL = import.meta.env.VITE_WS_URL ||
  (typeof window !== 'undefined'
    ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
    : 'ws://localhost:3001');

export default function App() {
  const wsRef = useRef(null);
  const [phase, setPhase] = useState('join');   // join | playing | dead
  const [playerId, setPlayerId] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [greeting, setGreeting] = useState(null);
  const [snapshot, setSnapshot] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [killfeed, setKillfeed] = useState([]);
  const [deathInfo, setDeathInfo] = useState(null);

  // Keep refs for values needed inside canvas/event handlers
  const playerIdRef = useRef(null);
  const phaseRef = useRef('join');

  useEffect(() => { playerIdRef.current = playerId; }, [playerId]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // ─── WebSocket ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let ws;
    let reconnectTimer;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => console.log('[WS] connected');

      ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }

        if (msg.type === 'joined') {
          setPlayerId(msg.id);
          playerIdRef.current = msg.id;
          setGreeting(msg.greeting);
          setJoinError(null);
          setPhase('playing');
          phaseRef.current = 'playing';
        }

        if (msg.type === 'error') {
          if (msg.code === 'wrong_password') setJoinError('Wrong password — try again.');
        }

        if (msg.type === 'snapshot') {
          setSnapshot(msg.data);
          if (msg.leaderboard && msg.leaderboard.length > 0) {
            setLeaderboard(msg.leaderboard);
          }
        }

        if (msg.type === 'death') {
          setDeathInfo(msg.data);
          setPhase('dead');
          phaseRef.current = 'dead';
        }

        if (msg.type === 'respawned') {
          setDeathInfo(null);
          setPhase('playing');
          phaseRef.current = 'playing';
        }

        if (msg.type === 'killfeed') {
          const entry = { ...msg.data, key: Date.now() + Math.random() };
          setKillfeed(prev => [entry, ...prev].slice(0, 6));
        }
      };

      ws.onclose = () => {
        console.log('[WS] disconnected, reconnecting…');
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  // ─── Input sender ───────────────────────────────────────────────────────────

  const sendInput = useCallback((dir, boost) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', dir, boost }));
    }
  }, []);

  // ─── Join / Respawn ─────────────────────────────────────────────────────────

  const handleJoin = useCallback((name, password) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join', name, password: password || '' }));
    }
  }, []);

  const handleRespawn = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'respawn' }));
    }
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {phase === 'join' && (
        <JoinScreen onJoin={handleJoin} error={joinError} />
      )}

      {(phase === 'playing' || phase === 'dead') && (
        <>
          <GameCanvas
            snapshot={snapshot}
            playerId={playerId}
            onInput={sendInput}
            active={phase === 'playing'}
          />
          <HUD
            leaderboard={leaderboard}
            killfeed={killfeed}
            snapshot={snapshot}
            playerId={playerId}
            greeting={greeting}
            onGreetingDismiss={() => setGreeting(null)}
          />
          {phase === 'dead' && (
            <DeathScreen info={deathInfo} onRespawn={handleRespawn} />
          )}
        </>
      )}
    </div>
  );
}
