import { ACHIEVEMENTS } from '../hooks/useAchievements.js';

const fmtTime = sec => {
  if (!sec) return '--';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

function Divider({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      fontSize: 9, fontWeight: 800, letterSpacing: 3, color: '#334155',
    }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      {label}
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(6,12,26,0.7)',
      border: `1px solid ${color}20`,
      borderTop: `2px solid ${color}`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{
        fontSize: 28, fontWeight: 900, color,
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: '#475569', letterSpacing: 2, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function AchCard({ ach, unlocked }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: unlocked ? 'rgba(6,12,26,0.8)' : 'rgba(6,12,26,0.35)',
      border: `1px solid ${unlocked ? ach.color + '44' : 'rgba(255,255,255,0.05)'}`,
      borderRadius: 12, padding: '14px 18px',
      position: 'relative', overflow: 'hidden',
      filter: unlocked ? 'none' : 'grayscale(0.85)',
      opacity: unlocked ? 1 : 0.4,
      boxShadow: unlocked ? `0 0 22px ${ach.glow}` : 'none',
      transition: 'box-shadow 0.3s',
    }}>
      {/* Shimmer on unlocked */}
      {unlocked && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(105deg, transparent 35%, ${ach.color}12 55%, transparent 75%)`,
          animation: 'achShimmer 3.5s infinite',
        }} />
      )}
      <span style={{ fontSize: 28, flexShrink: 0, position: 'relative' }}>{ach.icon}</span>
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: unlocked ? '#f1f5f9' : '#475569' }}>
          {ach.name}
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{ach.desc}</div>
      </div>
      {unlocked && (
        <div style={{
          position: 'relative',
          fontSize: 9, letterSpacing: 1.5, fontWeight: 800, color: ach.color,
          background: `${ach.color}18`, borderRadius: 20, padding: '3px 10px',
        }}>
          DONE
        </div>
      )}
      {!unlocked && (
        <div style={{ position: 'relative', fontSize: 16, color: '#1e293b' }}>
          {'\uD83D\uDD12'}
        </div>
      )}
    </div>
  );
}

export default function ProfilePanel({ stats, unlocked }) {
  const avg = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Primary stats */}
      <div>
        <Divider label="PLAYER STATS" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <StatCard icon="\uD83C\uDFAE" label="GAMES PLAYED"     value={stats.gamesPlayed}  color="#00f5ff" />
          <StatCard icon="\u2B50"       label="HIGHEST SCORE"    value={stats.highScore}    color="#fbbf24" />
          <StatCard icon="\uD83D\uDC51" label="BEST RANK"        value={stats.bestRank !== null ? `#${stats.bestRank}` : '--'} color="#a855f7" />
          <StatCard icon="\u23F1\uFE0F" label="LONGEST SURVIVAL" value={fmtTime(stats.highSurvivalSec)} color="#22c55e" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
          <StatCard icon="\uD83D\uDC80" label="TOTAL KILLS"   value={stats.totalKills} color="#ef4444" />
          <StatCard icon="\uD83D\uDCC8" label="AVG SCORE"     value={avg}              color="#f97316" />
          <StatCard icon="\uD83D\uDC0D" label="RECORD LENGTH" value={stats.highLength} color="#06b6d4" />
        </div>
      </div>

      {/* Achievements */}
      <div>
        <Divider label={`ACHIEVEMENTS ${[...unlocked].length}/${ACHIEVEMENTS.length}`} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {ACHIEVEMENTS.map(a => (
            <AchCard key={a.id} ach={a} unlocked={unlocked.has(a.id)} />
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
