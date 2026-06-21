import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './components/GameCanvas.jsx';
import HUD from './components/HUD.jsx';
import LobbyScreen from './components/LobbyScreen.jsx';
import DeathScreen from './components/DeathScreen.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import AchievementToast from './components/AchievementToast.jsx';
import { usePlayerStats } from './hooks/usePlayerStats.js';
import { useAchievements } from './hooks/useAchievements.js';
import { audio } from './audio/AudioManager.js';

const WS_URL = import.meta.env.VITE_WS_URL ||
  (typeof window !== 'undefined'
    ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
    : 'ws://localhost:3001');

export default function App() {
  const wsRef = useRef(null);
  const { stats, recordDeath } = usePlayerStats();
  const { unlocked, toasts, tryUnlock, dismissToast } = useAchievements();

  // ── Phase + core state ────────────────────────────────────────────────────
  const [phase, setPhase]               = useState('lobby'); // lobby|playing|dead|gameover
  const [playerId, setPlayerId]         = useState(null);
  const [playerName, setPlayerName]     = useState('');
  const [playerPin, setPlayerPin]       = useState('');
  const [roomCode, setRoomCode]         = useState(null);
  const [greeting, setGreeting]         = useState(null);
  const [lobbyError, setLobbyError]     = useState(null);
  const [lobbyLoading, setLobbyLoading] = useState(false);
  const [createdCode, setCreatedCode]   = useState(null);
  const [snapshot, setSnapshot]         = useState(null);
  const [leaderboard, setLeaderboard]   = useState([]);
  const [killfeed, setKillfeed]         = useState([]);
  const [deathInfo, setDeathInfo]       = useState(null);
  const [gameOverData, setGameOverData] = useState(null);
  const [timeLeftMs, setTimeLeftMs]     = useState(null);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const playerIdRef   = useRef(null);
  const playerNameRef = useRef('');
  const phaseRef      = useRef('lobby');
  const pendingRef    = useRef({});
  const leaderboardRef = useRef([]);

  useEffect(() => { playerIdRef.current   = playerId;     }, [playerId]);
  useEffect(() => { playerNameRef.current = playerName;   }, [playerName]);
  useEffect(() => { phaseRef.current      = phase;        }, [phase]);
  useEffect(() => { leaderboardRef.current = leaderboard; }, [leaderboard]);

  // ── Session runtime tracking ──────────────────────────────────────────────
  const sessRef = useRef({
    kills: 0, startMs: null,
    boostStartMs: null, maxBoostSec: 0,
    eatTimestamps: [], maxQuickEat: 0,
    prevScore: 0,
  });

  const resetSession = () => {
    sessRef.current = {
      kills: 0, startMs: Date.now(),
      boostStartMs: null, maxBoostSec: 0,
      eatTimestamps: [], maxQuickEat: 0,
      prevScore: 0,
    };
  };

  // ── WebSocket ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let ws, reconnectTimer;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => { console.log('[WS] connected'); audio.resume(); };

      ws.onmessage = (e) => {
        let msg;
        try { msg = JSON.parse(e.data); } catch { return; }

        // Lobby responses
        if (msg.type === 'name_status') { pendingRef.current.nameStatus?.(msg); return; }
        if (msg.type === 'room_info')   { pendingRef.current.roomInfo?.(msg);   return; }

        // Room created
        if (msg.type === 'room_created') {
          setLobbyLoading(false);
          setCreatedCode(msg.roomCode);
          setTimeout(() => {
            setPlayerId(msg.id); playerIdRef.current = msg.id;
            setRoomCode(msg.roomCode);
            setGreeting(msg.greeting);
            setLobbyError(null);
            setPhase('playing'); phaseRef.current = 'playing';
            resetSession();
            audio.join();
          }, 2000);
          return;
        }

        // Joined existing room
        if (msg.type === 'joined') {
          setLobbyLoading(false);
          setPlayerId(msg.id); playerIdRef.current = msg.id;
          setRoomCode(msg.roomCode);
          setGreeting(msg.greeting);
          setLobbyError(null);
          setCreatedCode(null);
          setPhase('playing'); phaseRef.current = 'playing';
          resetSession();
          audio.join();
          return;
        }

        // Error
        if (msg.type === 'error') {
          setLobbyLoading(false);
          setLobbyError(msg.message || 'Something went wrong.');
          return;
        }

        // Snapshot
        if (msg.type === 'snapshot') {
          setSnapshot(msg.data);
          if (msg.leaderboard?.length > 0) {
            setLeaderboard(msg.leaderboard);
            leaderboardRef.current = msg.leaderboard;
          }
          if (msg.timeLeftMs !== undefined) setTimeLeftMs(msg.timeLeftMs);

          // Runtime tracking
          const me = msg.data?.snakes?.find(s => s.id === playerIdRef.current);
          if (me && phaseRef.current === 'playing') {
            const sess = sessRef.current;
            const now  = Date.now();

            // Boost tracking
            if (me.boosting) {
              if (!sess.boostStartMs) sess.boostStartMs = now;
              const sec = (now - sess.boostStartMs) / 1000;
              if (sec > sess.maxBoostSec) sess.maxBoostSec = sec;
              audio.startBoost();
            } else {
              if (sess.boostStartMs) { sess.boostStartMs = null; audio.stopBoost(); }
            }

            // Eat tracking (score increase = pellet eaten)
            if (me.score > sess.prevScore) {
              audio.eat();
              const diff = me.score - sess.prevScore;
              for (let i = 0; i < diff; i++) sess.eatTimestamps.push(now);
              const recent = sess.eatTimestamps.filter(t => t > now - 5000);
              sess.eatTimestamps = recent;
              if (recent.length > sess.maxQuickEat) sess.maxQuickEat = recent.length;
            }
            sess.prevScore = me.score;
          }
          return;
        }

        // Death
        if (msg.type === 'death') {
          audio.stopBoost();
          const sess = sessRef.current;
          const survivalSec = sess.startMs ? Math.round((Date.now() - sess.startMs) / 1000) : 0;
          const d = msg.data || {};
          const lb = leaderboardRef.current;
          const rank = lb.length > 0 ? (lb.findIndex(e => e.id === playerIdRef.current) + 1) || null : null;

          recordDeath({ score: d.score || 0, survivalSec, kills: sess.kills, length: d.length || 0, rank });

          const updatedStats = {
            ...stats,
            highScore:  Math.max(stats.highScore,  d.score  || 0),
            totalKills: stats.totalKills + sess.kills,
            highLength: Math.max(stats.highLength, d.length || 0),
          };
          tryUnlock(updatedStats, { maxBoostSec: sess.maxBoostSec, maxQuickEat: sess.maxQuickEat });

          setDeathInfo({ ...d, sessionKills: sess.kills, survivalSec });
          setPhase('dead'); phaseRef.current = 'dead';
          audio.die();
          return;
        }

        // Respawned (also covers new round auto-respawn)
        if (msg.type === 'respawned') {
          setDeathInfo(null);
          setGameOverData(null);
          setPhase('playing'); phaseRef.current = 'playing';
          resetSession();
          audio.join();
          return;
        }

        // Game over — 5-minute round ended
        if (msg.type === 'game_over') {
          audio.stopBoost();
          setGameOverData({ leaderboard: msg.leaderboard || [], winner: msg.winner || null });
          setPhase('gameover'); phaseRef.current = 'gameover';
          return;
        }

        // Killfeed
        if (msg.type === 'killfeed') {
          const kd = msg.data;
          setKillfeed(prev => [{ ...kd, key: Date.now() + Math.random() }, ...prev].slice(0, 6));
          if (kd.killerName && playerNameRef.current && kd.killerName === playerNameRef.current) {
            sessRef.current.kills++;
            audio.kill();
          }
          return;
        }
      };

      ws.onclose = () => { reconnectTimer = setTimeout(connect, 2000); };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => { clearTimeout(reconnectTimer); ws?.close(); };
  }, []); // eslint-disable-line

  const wsSend = useCallback((obj) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(obj));
  }, []);

  // ── Lobby actions ──────────────────────────────────────────────────────────
  const handleCreate = useCallback((name, pin, roomPassword) => {
    setLobbyError(null); setLobbyLoading(true);
    setPlayerName(name); playerNameRef.current = name;
    setPlayerPin(pin);
    wsSend({ type: 'create_room', name, pin, roomPassword });
  }, [wsSend]);

  const handleJoin = useCallback((code, name, pin, password) => {
    setLobbyError(null); setLobbyLoading(true);
    setPlayerName(name); playerNameRef.current = name;
    setPlayerPin(pin);
    wsSend({ type: 'join_room', roomCode: code, name, pin, password });
  }, [wsSend]);

  const handleCheckRoom = useCallback((code) => {
    return new Promise(resolve => {
      pendingRef.current.roomInfo = resolve;
      wsSend({ type: 'check_room', roomCode: code });
      setTimeout(() => {
        if (pendingRef.current.roomInfo === resolve) {
          pendingRef.current.roomInfo = null;
          resolve({ exists: false, passwordRequired: false });
        }
      }, 3000);
    });
  }, [wsSend]);

  const handleInput   = useCallback((dir, boost) => wsSend({ type: 'input', dir, boost }), [wsSend]);
  const handleRespawn = useCallback(() => wsSend({ type: 'respawn' }), [wsSend]);

  const inGame = phase === 'playing' || phase === 'dead' || phase === 'gameover';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {phase === 'lobby' && (
        <LobbyScreen
          onCreate={handleCreate} onJoin={handleJoin} onCheckRoom={handleCheckRoom}
          error={lobbyError} loading={lobbyLoading} createdCode={createdCode}
          stats={stats} unlocked={unlocked}
          playerName={playerName} pin={playerPin}
        />
      )}

      {inGame && (
        <>
          <GameCanvas
            snapshot={snapshot} playerId={playerId}
            onInput={handleInput} active={phase === 'playing'}
          />
          <HUD
            leaderboard={leaderboard} killfeed={killfeed}
            snapshot={snapshot} playerId={playerId}
            roomCode={roomCode} greeting={greeting}
            onGreetingDismiss={() => setGreeting(null)}
            timeLeftMs={timeLeftMs}
          />
          {phase === 'dead' && (
            <DeathScreen
              info={deathInfo} onRespawn={handleRespawn}
              sessionStats={deathInfo ? { kills: deathInfo.sessionKills, survivalSec: deathInfo.survivalSec } : null}
            />
          )}
          {phase === 'gameover' && (
            <GameOverScreen
              leaderboard={gameOverData?.leaderboard || []}
              winner={gameOverData?.winner}
              onClose={() => {}} // auto-handled when server sends respawned
            />
          )}
        </>
      )}

      <AchievementToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
