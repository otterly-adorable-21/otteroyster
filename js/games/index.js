// Arcade registry: game id -> lazy loader. Metadata lives in data.js (GAME_LIST).
export const LOADERS = {
  dive: () => import('./dive.js'),
  frenzy: () => import('./frenzy.js'),
  hop: () => import('./hop.js'),
  fishing: () => import('./fishing.js'),
  bubbles: () => import('./bubbles.js'),
  crabs: () => import('./crabs.js'),
  memory: () => import('./memory.js'),
  pop: () => import('./pop.js'),
  shuffle: () => import('./shuffle.js'),
  words: () => import('./words.js'),
};
