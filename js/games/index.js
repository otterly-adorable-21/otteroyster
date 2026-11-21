// Arcade registry: game id -> lazy loader. Metadata lives in data.js (GAME_LIST).
// Bump V when games change so browsers never mix old and new files.
const V = '7';
export const LOADERS = {
  dive: () => import(`./dive.js?v=${V}`),
  frenzy: () => import(`./frenzy.js?v=${V}`),
  hop: () => import(`./hop.js?v=${V}`),
  fishing: () => import(`./fishing.js?v=${V}`),
  bubbles: () => import(`./bubbles.js?v=${V}`),
  crabs: () => import(`./crabs.js?v=${V}`),
  memory: () => import(`./memory.js?v=${V}`),
  pop: () => import(`./pop.js?v=${V}`),
  shuffle: () => import(`./shuffle.js?v=${V}`),
  words: () => import(`./words.js?v=${V}`),
};
