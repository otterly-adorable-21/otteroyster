// Trinkets to show off, books to read and fish for the aquarium.
// Trinkets turn up while exploring (and on Captain Barnacle's boat) and can be
// displayed in the den's collection cabinets. Shared by the website and Discord.

// group: which display shows it. where: places it tends to wash up ('any' = anywhere)
export const TRINKETS = {
  // beachcombing finds (Shell Collection Cabinet)
  seaglassbit: { name: 'Sea Glass', icon: '🟢', group: 'beach', rarity: 'common', where: ['tidepools', 'lighthouse'] },
  sharktooth: { name: 'Shark Tooth', icon: '🦷', group: 'beach', rarity: 'uncommon', where: ['reef', 'shipwreck'] },
  tinyshells: { name: 'Tiny Shells', icon: '🐚', group: 'beach', rarity: 'common', where: ['tidepools', 'lilypond'] },
  sanddollar: { name: 'Sand Dollar', icon: '🪙', group: 'beach', rarity: 'uncommon', where: ['tidepools', 'reef'] },
  driftwoodbit: { name: 'Driftwood', icon: '🪵', group: 'beach', rarity: 'common', where: ['shipwreck', 'willow'] },
  bottlemsg: { name: 'Message in a Bottle', icon: '🍾', group: 'beach', rarity: 'rare', where: ['shipwreck', 'lighthouse'] },
  coralbit: { name: 'Coral Fragment', icon: '🪸', group: 'beach', rarity: 'common', where: ['reef'] },
  // fossils and pearls
  ammonite: { name: 'Ammonite Fossil', icon: '🐌', group: 'fossil', rarity: 'rare', where: ['trench', 'lighthouse'] },
  trilobite: { name: 'Trilobite Fossil', icon: '🪲', group: 'fossil', rarity: 'rare', where: ['trench', 'willow'] },
  fossilfern: { name: 'Fern Fossil', icon: '🌿', group: 'fossil', rarity: 'uncommon', where: ['willow'] },
  blackpearl: { name: 'Black Pearl', icon: '⚫', group: 'pearls', rarity: 'rare', where: ['reef', 'trench'] },
  pinkpearl: { name: 'Pink Pearl', icon: '🩷', group: 'pearls', rarity: 'uncommon', where: ['reef', 'lilypond'] },
  goldpearl: { name: 'Golden Pearl', icon: '🟡', group: 'pearls', rarity: 'legendary', where: ['reef', 'trench'] },
  // otter treasures: favorite rocks (Rock Collection Shelf)
  skipstone: { name: 'Smooth Skipping Stone', icon: '🪨', group: 'rocks', rarity: 'common', where: ['lilypond', 'willow'] },
  heartpebble: { name: 'Heart-Shaped Pebble', icon: '🤎', group: 'rocks', rarity: 'uncommon', where: ['any'] },
  geode: { name: 'Glittering Geode', icon: '💜', group: 'rocks', rarity: 'rare', where: ['trench', 'lighthouse'] },
  agate: { name: 'Polished Agate', icon: '🟠', group: 'rocks', rarity: 'uncommon', where: ['tidepools'] },
  moonstone: { name: 'Moonstone', icon: '🌕', group: 'rocks', rarity: 'rare', where: ['trench'] },
  goldnugget: { name: 'Tiny Gold Nugget', icon: '🟨', group: 'rocks', rarity: 'rare', where: ['willow', 'shipwreck'] },
  rockset: { name: 'Favorite Rock Collection', icon: '🫘', group: 'rocks', rarity: 'common', where: ['any'] },
  luckystone: { name: 'Engraved Lucky Stone', icon: '🍀', group: 'rocks', rarity: 'uncommon', where: ['lilypond'] },
  friendpebble: { name: 'Friendship Pebble', icon: '💞', group: 'rocks', rarity: 'uncommon', where: ['any'] },
  carvedstone: { name: 'Ancient Carved Stone', icon: '🗿', group: 'rocks', rarity: 'legendary', where: ['trench', 'lighthouse'] },
  // novelty collectibles (Trophy Cabinet)
  rubberduck: { name: 'Tiny Rubber Duck', icon: '🐤', group: 'novelty', rarity: 'common', where: ['lilypond'] },
  miniship: { name: 'Miniature Ship', icon: '⛵', group: 'novelty', rarity: 'uncommon', where: ['shipwreck'] },
  brokencompass: { name: 'Broken Compass', icon: '🧭', group: 'novelty', rarity: 'uncommon', where: ['shipwreck', 'lighthouse'] },
  antiquekey: { name: 'Antique Key', icon: '🗝️', group: 'novelty', rarity: 'uncommon', where: ['shipwreck'] },
  oldwatch: { name: 'Old Pocket Watch', icon: '⌚', group: 'novelty', rarity: 'rare', where: ['shipwreck', 'trench'] },
  toysub: { name: 'Toy Submarine', icon: '🚢', group: 'novelty', rarity: 'rare', where: ['reef'] },
  snowglobetoy: { name: 'Little Snow Globe', icon: '🔮', group: 'novelty', rarity: 'rare', where: ['any'] },
  oldpostcard: { name: 'Vintage Postcard', icon: '🖼️', group: 'postcards', rarity: 'common', where: ['any'] },
  teacup: { name: 'Tiny Teacup', icon: '☕', group: 'novelty', rarity: 'uncommon', where: ['willow', 'shipwreck'] },
  figurine: { name: 'Otter Figurine', icon: '🦦', group: 'novelty', rarity: 'rare', where: ['any'] },
};
export const TRINKET_IDS = Object.keys(TRINKETS);
export const TRINKET_GROUPS = {
  beach: 'Beachcombing finds', fossil: 'Fossils', pearls: 'Rare pearls', rocks: 'Otter treasures', novelty: 'Novelty collectibles', postcards: 'Postcards',
};
export const TRINKET_CHANCE = 0.16; // per explore
const W = { common: 10, uncommon: 4, rare: 1.5, legendary: 0.4 };

// Pick a trinket that might wash up at a place (r is a 0..1 random number).
export function trinketFor(place, r) {
  const pool = TRINKET_IDS.filter((id) => TRINKETS[id].where.includes(place) || TRINKETS[id].where.includes('any'));
  const total = pool.reduce((a, id) => a + W[TRINKETS[id].rarity], 0);
  let x = r * total;
  for (const id of pool) { x -= W[TRINKETS[id].rarity]; if (x < 0) return id; }
  return pool[0];
}

// ---------- the bookshelf: collectible storybooks ----------
export const BOOKS = {
  tidepoet: { title: 'Poems of the Tide', icon: '📘', text: 'The tide goes out, the tide comes in, / it takes a little, gives again. / Whatever floats away from you / will find its way back, wet and new.' },
  barnaclelog: { title: "Captain's Log of the Saltwind", icon: '📕', text: 'Day 41. Still no sign of the cheese. Crew morale is low. The cook insists it was "right here a minute ago." I suspect the gulls.' },
  ottercare: { title: 'A Pup’s Guide to Floating', icon: '📗', text: 'Step one: lie back. Step two: hold paws with a friend. Step three: there is no step three. You are floating. Well done.' },
  stars: { title: 'The Night Sky Over the Pond', icon: '📙', text: 'The seven brightest stars form the Great Otter, who swims across the sky every winter, holding the moon like an oyster.' },
  recipes: { title: "Willow's Recipe Book", icon: '📒', text: 'Kelp Crisps: dry the kelp on a warm rock, salt with sea spray, and hide them from Pip. Serves everyone who smells them.' },
  lighthouse: { title: 'How to Keep a Lighthouse', icon: '📓', text: 'Polish the lens every dawn. Count the ships. Never let the lamp go out, unless someone you love is following a different light.' },
  fishtales: { title: 'Fish Tales', icon: '📔', text: 'The biggest fish in the pond is named Gordon. Nobody has seen Gordon. Everybody has a story about Gordon.' },
  mapmaker: { title: 'The Mapmaker’s Notebook', icon: '📖', text: 'A map is just a list of places someone was brave enough to visit. Leave room in the margins for the places you haven’t found yet.' },
};
export const BOOK_IDS = Object.keys(BOOKS);
export const BOOK_CHANCE = 0.04; // per explore

// ---------- the aquarium ----------
export const FISH = {
  guppy: { name: 'Rainbow Guppy', icon: '🐟', rarity: 'common', color: '#ff922b' },
  goldfish: { name: 'Goldfish', icon: '🐠', rarity: 'common', color: '#fab005' },
  minnow: { name: 'Silver Minnow', icon: '🐟', rarity: 'common', color: '#adb5bd' },
  clown: { name: 'Clownfish', icon: '🐠', rarity: 'uncommon', color: '#fd7e14' },
  bluetang: { name: 'Blue Tang', icon: '🐟', rarity: 'uncommon', color: '#228be6' },
  seahorsefish: { name: 'Dwarf Seahorse', icon: '🐴', rarity: 'uncommon', color: '#f783ac' },
  puffer: { name: 'Pufferfish', icon: '🐡', rarity: 'rare', color: '#ffd43b' },
  angel: { name: 'Angelfish', icon: '🐠', rarity: 'rare', color: '#7950f2' },
  jelly: { name: 'Moon Jelly', icon: '🪼', rarity: 'rare', color: '#e599f7' },
  lantern: { name: 'Lanternfish', icon: '🐟', rarity: 'legendary', color: '#3bc9db' },
};
export const FISH_IDS = Object.keys(FISH);
export const FISHING_COOLDOWN = 3 * 3600000;
export function fishFor(r) {
  const total = FISH_IDS.reduce((a, id) => a + W[FISH[id].rarity], 0);
  let x = r * total;
  for (const id of FISH_IDS) { x -= W[FISH[id].rarity]; if (x < 0) return id; }
  return FISH_IDS[0];
}
