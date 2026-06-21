import { useState } from 'react';
import { audio } from '../audio/AudioManager.js';

const TABS = [
  { id: 'global', label: 'Global All-Time', icon: '\uD83C\uDF0D' },
  { id: 'weekly', label: 'Weekly Arena',    icon: '\uD83D\uDCC5' },
  { id: 'daily',  label: 'Daily Blitz',     icon: '\u26A1' },
];

export default function HallOfFame({ stats }) {
  const [tab, setTab] = useState('global');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(6,12,26,0.7)', borderRadius: 12, padding: 4,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); audio.navSwitch(); }}
            style={{
              flex: 1, padding: '10px 4px', border: 'none', borderRadius: 9, cursor: 'pointer',
              fontWeight: 700, fontSize: 11, letterSpacing: 1, transition: 'all 0.2s',
              background: tab === t.id ? 'rgba(0,200,255,0.1)' : 'transparent',
              color: tab === t.id ? '#00f5ff' : '#475569',
              borderBottom: tab === t.id ? '2px solid #00f5ff' : '2px solid transparent',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      {tab === 'global' && <GlobalTab stats={stats} />}
      {tab !== 'global' && <ComingSoon tab={tab} />}
    </div>
  );
}

function GlobalTab({ stats }) {
  const fmtTime = s => {
    if (!s) return '--';
    const m = Math.floor(s / 60), sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${s}s`;
  };
  const hasData = stats.gamesPlayed > 0;
  const rows = [
    { label: 'Best Score',    val: stats.highScore,    color: '#fbbf24', icon: '\u2B50' },
    { label: 'Record Length', val: stats.highLength,   color: '#22c55e', icon: '\uD83D\uDC0D' },
    { label: 'Best Rank',     val: stats.bestRank !== null ? `#${stats.bestRank}` : '--', color: '#a855f7', icon: '\uD83D\uDC51' },
    { label: 'Longest Run',   val: fmtTime(stats.highSurvivalSec), color: '#06b6d4', icon: '\u23F1\uFE0F' },
    { label: 'Total Kills',   val: stats.totalKills,   color: '#ef4444', icon: '\uD83D\uDC80' },
    { label: 'Games Played',  val: stats.gamesPlayed,  color: '#f97316', icon: '\uD83C\uDFAE' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!hasData ? (
        <div style={{
          padding: '50px 20px', textAlign: 'center',
          background: 'rgba(6,12,26,0.5)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 14,
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🏆</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>No records yet</div>
          <div style={{ fontSize: 11, color: '#334155', marginTop: 6 }}>Play your first game to claim the throne</div>
        </div>
      ) : (
        <>
          {/* Hero card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.07), rgba(168,85,247,0.07))',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 14, padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: 'linear-gradient(105deg, transparent 30%, rgba(251,191,36,0.05) 50%, transparent 70%)',
              animation: 'hofShimmer 4s infinite',
            }} />
            <div style={{ fontSize: 44, position: 'relative' }}>👑</div>
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#fbbf24', fontWeight: 800 }}>PERSONAL BEST</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginTop: 2 }}>
                {stats.highScore}
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400, marginLeft: 8 }}>points</span>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right', position: 'relative' }}>
              <div style={{ fontSize: 10, color: '#64748b' }}>Length record</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#22c55e' }}>{stats.highLength}</div>
            </div>
          </div>

          {/* Stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {rows.map(s => (
              <div key={s.label} style={{
                background: 'rgba(6,12,26,0.6)', border: `1px solid ${s.color}18`,
                borderRadius: 10, padding: '12px 16px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 10, color: '#475569', letterSpacing: 1 }}>{s.label}</div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>{s.icon}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{
        background: 'rgba(6,12,26,0.5)', border: '1px solid rgba(0,200,255,0.07)',
        borderRadius: 10, padding: '12px 16px',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <span style={{ fontSize: 18 }}>🌐</span>
        <div style={{ fontSize: 10, color: '#334155', lineHeight: 1.7 }}>
          <span style={{ color: '#64748b', fontWeight: 700 }}>Global rankings</span> — cross-server aggregation coming soon. Stats saved locally.
        </div>
      </div>

      <style>{`@keyframes hofShimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }`}</style>
    </div>
  );
}

function ComingSoon({ tab }) {
  const t = TABS.find(x => x.id === tab);
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
      padding: '60px 20px', textAlign: 'center',
      background: 'rgba(6,12,26,0.5)', border: '1px solid rgba(255,255,255,0.04)',
      borderRadius: 14,
    }}>
      <div style={{ fontSize: 52 }}>{t?.icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{t?.label}</div>
      <div style={{ fontSize: 12, color: '#64748b', maxWidth: 280, lineHeight: 1.7 }}>
        {tab === 'weekly'
          ? 'Weekly Arena resets every Monday. Compete globally for the highest weekly rank.'
          : 'Daily Blitz — ultra-competitive 5-minute ranked sessions, reset every midnight.'}
      </div>
      <div style={{
        fontSize: 9, letterSpacing: 2, fontWeight: 800,
        color: '#f97316', background: 'rgba(249,115,22,0.08)',
        border: '1px solid rgba(249,115,22,0.2)',
        borderRadius: 20, padding: '5px 16px',
      }}>COMING SOON</div>
    </div>
  );
}
