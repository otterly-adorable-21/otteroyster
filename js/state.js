// Save/load the game in the browser's localStorage.
const KEY = 'otteroyster.save.v1';

export function defaultState() {
  const now = Date.now();
  return {
    version: 1,
    name: '',
    created: now,
    lastTick: now,
    stats: { hunger: 80, happiness: 80, energy: 80, clean: 80 },
    pearls: 25,
    xp: 0,
    level: 1,
    owned: [],
    equipped: { hat: null, eyes: null, neck: null, back: null },
    sleeping: false,
    mission: null,
    lastDaily: null,
    best: { dive: 0, memory: null },
    log: [],
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    const base = defaultState();
    return {
      ...base,
      ...saved,
      stats: { ...base.stats, ...saved.stats },
      equipped: { ...base.equipped, ...saved.equipped },
      best: { ...base.best, ...saved.best },
    };
  } catch {
    return null;
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable (private mode etc.) — game still works for this visit */
  }
}

export function clear() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
