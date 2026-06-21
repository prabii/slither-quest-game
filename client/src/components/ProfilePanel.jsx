import { ACHIEVEMENTS } from '../hooks/useAchievements.js';

const fmtTime = sec => {
  if (!sec) return '--';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

function SectionLabel({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontSize: 9, fontWeight: 800, letterSpacing: 3, color: '#334155',
      marginBottom: 14,
    }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      {children}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(6,12,26,0.75)',
      border: `1px solid ${color}22`,
      borderTop: `2px solid ${color}`,
      borderRadius: 14,
      padding: '18px 16px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow bleed */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 40,
        background: `linear-gradient(180deg, ${color}0e, transparent)`,
        pointerEvents: 'none',
      }} />
      <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
      <div style={{
        fontSize: 30, fontWeight: 900, color,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
        textShadow: `0 0 20px ${color}55`,
      }}>{value}</div>
      <div style={{ fontSize: 9, color: '#475569', letterSpacing: 2.5, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function AchCard({ ach, isUnlocked }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16,
      background: isUnlocked ? 'rgba(6,12,26,0.85)' : 'rgba(6,12,26,0.3)',
      border: `1px solid ${isUnlocked ? ach.color + '50' : 'rgba(255,255,255,0.04)'}`,
      borderRadius: 12, padding: '14px 18px',
      position: 'relative', overflow: 'hidden',
      opacity: isUnlocked ? 1 : 0.38,
      boxShadow: isUnlocked ? `0 0 24px ${ach.glow}` : 'none',
      transition: 'all 0.3s',
    }}>
      {isUnlocked && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(110deg, transparent 30%, ${ach.color}10 55%, transparent 75%)`,
          animation: 'achShimmer 3.5s ease infinite',
        }} />
      )}
      <span style={{ fontSize: 30, flexShrink: 0, position: 'relative', filter: isUnlocked ? 'none' : 'grayscale(1)' }}>
        {ach.icon}
      </span>
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: isUnlocked ? '#f1f5f9' : '#334155' }}>
          {ach.name}
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 3 }}>{ach.desc}</div>
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {isUnlocked ? (
          <div style={{
            fontSize: 9, letterSpacing: 1.5, fontWeight: 800, color: ach.color,
            background: `${ach.color}18`, border: `1px solid ${ach.color}30`,
            borderRadius: 20, padding: '4px 10px',
          }}>DONE</div>
        ) : (
          <span style={{ fontSize: 18, opacity: 0.3 }}>🔒</span>
        )}
      </div>
    </div>
  );
}

export default function ProfilePanel({ stats, unlocked }) {
  const avg = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
  const doneCount = [...unlocked].length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>

      {/* ── Stats ── */}
      <div>
        <SectionLabel>PLAYER STATS</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <StatCard icon="🎮" label="GAMES PLAYED"     value={stats.gamesPlayed}  color="#00f5ff" />
          <StatCard icon="⭐" label="HIGHEST SCORE"    value={stats.highScore}    color="#fbbf24" />
          <StatCard icon="👑" label="BEST RANK"        value={stats.bestRank !== null ? `#${stats.bestRank}` : '--'} color="#a855f7" />
          <StatCard icon="⏱️" label="LONGEST SURVIVAL" value={fmtTime(stats.highSurvivalSec)} color="#22c55e" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
          <StatCard icon="💀" label="TOTAL KILLS"   value={stats.totalKills} color="#ef4444" />
          <StatCard icon="📈" label="AVG SCORE"     value={avg}              color="#f97316" />
          <StatCard icon="🐍" label="RECORD LENGTH" value={stats.highLength} color="#06b6d4" />
        </div>
      </div>

      {/* ── Achievements ── */}
      <div>
        <SectionLabel>ACHIEVEMENTS {doneCount}/{ACHIEVEMENTS.length}</SectionLabel>
        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${(doneCount / ACHIEVEMENTS.length) * 100}%`,
              background: 'linear-gradient(90deg, #00f5ff, #a855f7)',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 8px rgba(0,245,255,0.5)',
            }} />
          </div>
          <div style={{ fontSize: 9, color: '#475569', marginTop: 5, textAlign: 'right', letterSpacing: 1 }}>
            {doneCount === ACHIEVEMENTS.length ? '🎉 ALL UNLOCKED' : `${ACHIEVEMENTS.length - doneCount} remaining`}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ACHIEVEMENTS.map(a => (
            <AchCard key={a.id} ach={a} isUnlocked={unlocked.has(a.id)} />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes achShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
