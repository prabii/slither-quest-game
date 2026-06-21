import { useState, useCallback } from 'react';

const KEY = 'sq_stats_v2';

const defaults = {
  gamesPlayed: 0,
  highScore: 0,
  totalScore: 0,
  highSurvivalSec: 0,
  totalKills: 0,
  highLength: 0,
  bestRank: null,
};

const load = () => {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...defaults }; }
};

export function usePlayerStats() {
  const [stats, setStats] = useState(load);

  const recordDeath = useCallback(({ score = 0, survivalSec = 0, kills = 0, length = 0, rank = null } = {}) => {
    setStats(prev => {
      const next = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        highScore: Math.max(prev.highScore, score),
        totalScore: prev.totalScore + score,
        highSurvivalSec: Math.max(prev.highSurvivalSec, survivalSec),
        totalKills: prev.totalKills + kills,
        highLength: Math.max(prev.highLength, length),
        bestRank:
          prev.bestRank === null
            ? rank
            : rank !== null && rank < prev.bestRank
              ? rank
              : prev.bestRank,
      };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return { stats, recordDeath };
}
