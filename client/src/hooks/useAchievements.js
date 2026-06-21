import { useState, useCallback } from 'react';

const KEY = 'sq_ach_v2';

export const ACHIEVEMENTS = [
  { id: 'first_blood',      name: 'First Blood',      desc: 'Eliminate your first opponent',      icon: '\u2694\uFE0F', color: '#ef4444', glow: 'rgba(239,68,68,0.35)' },
  { id: 'titanium_tail',    name: 'Titanium Tail',    desc: 'Reach a body length of 100',         icon: '\uD83D\uDD29', color: '#94a3b8', glow: 'rgba(148,163,184,0.35)' },
  { id: 'speed_demon',      name: 'Speed Demon',      desc: 'Boost for 30 consecutive seconds',   icon: '\u26A1',       color: '#f97316', glow: 'rgba(249,115,22,0.35)' },
  { id: 'cosmic_giant',     name: 'Cosmic Giant',     desc: 'Achieve a score of 500 in one game', icon: '\uD83C\uDF0C', color: '#a855f7', glow: 'rgba(168,85,247,0.35)' },
  { id: 'black_hole_eater', name: 'Black Hole Eater', desc: 'Eat 10 pellets in 5 seconds',        icon: '\uD83D\uDD73\uFE0F', color: '#3b82f6', glow: 'rgba(59,130,246,0.35)' },
];

const loadSet = () => {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); }
  catch { return new Set(); }
};

export function useAchievements() {
  const [unlocked, setUnlocked] = useState(loadSet);
  const [toasts, setToasts]     = useState([]);

  const tryUnlock = useCallback((stats, rt = {}) => {
    const newOnes = [];
    setUnlocked(prev => {
      const next = new Set(prev);
      for (const a of ACHIEVEMENTS) {
        if (next.has(a.id)) continue;
        let earn = false;
        if (a.id === 'first_blood')      earn = (stats.totalKills  || 0) >= 1;
        if (a.id === 'titanium_tail')    earn = (stats.highLength   || 0) >= 100;
        if (a.id === 'speed_demon')      earn = (rt.maxBoostSec     || 0) >= 30;
        if (a.id === 'cosmic_giant')     earn = (stats.highScore    || 0) >= 500;
        if (a.id === 'black_hole_eater') earn = (rt.maxQuickEat     || 0) >= 10;
        if (earn) { next.add(a.id); newOnes.push(a); }
      }
      if (newOnes.length) {
        try { localStorage.setItem(KEY, JSON.stringify([...next])); } catch {}
      }
      return next;
    });
    if (newOnes.length) {
      setToasts(p => [...p, ...newOnes.map(a => ({ ...a, key: Date.now() + Math.random() }))]);
    }
  }, []);

  const dismissToast = useCallback(key => {
    setToasts(p => p.filter(t => t.key !== key));
  }, []);

  return { unlocked, toasts, tryUnlock, dismissToast };
}
