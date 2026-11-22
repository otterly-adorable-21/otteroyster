// Themed collections: pieces from the den, front door and closet that go
// together. Own the whole set to claim a reward. Shared by website and Discord.
// kind: 'furn' (den furniture), 'door' (front door), 'item' (closet)

export const SETS = [
  {
    id: 'cottage', name: 'Coastal Cottage', icon: '🏡', reward: 120,
    desc: 'Sea breezes, blue flowers and a note in a bottle.',
    items: [['furn', 'seagrassrug'], ['door', 'plant-hydrangea'], ['item', 'seaglassframes'], ['door', 'mat-scallop'], ['door', 'lights-bottle']],
  },
  {
    id: 'deepsea', name: 'Deep Sea', icon: '🪼', reward: 160,
    desc: 'Glowing things from the bottom of the trench.',
    items: [['furn', 'anglerplush'], ['furn', 'jellyrug'], ['door', 'lights-glowcap'], ['item', 'oceantint'], ['item', 'shoulderoctopus'], ['furn', 'seabunny']],
  },
  {
    id: 'forest', name: 'Forest Dweller', icon: '🌲', reward: 120,
    desc: 'Berries, lavender and a basket for foraging.',
    items: [['furn', 'beaverplush'], ['furn', 'berryrug'], ['door', 'plant-lavender'], ['door', 'plant-mushroom'], ['door', 'mat-leaf'], ['item', 'wickerbasket']],
  },
  {
    id: 'explorer', name: 'Little Explorer', icon: '🧭', reward: 150,
    desc: 'Everything a young adventurer needs.',
    items: [['furn', 'whaleplush'], ['furn', 'compassrug'], ['door', 'mat-lighthouse'], ['door', 'lights-buoy'], ['item', 'aviators'], ['item', 'telescope']],
  },
  {
    id: 'spring', name: 'Springtime', icon: '🌸', reward: 120,
    desc: 'Blossoms, moonbeams and heart-shaped sunglasses.',
    items: [['furn', 'seabunny'], ['furn', 'flowerrug'], ['door', 'plant-cherry'], ['door', 'lights-moonbeam'], ['door', 'mat-flower'], ['item', 'heartsunnies']],
  },
];
export const SET = Object.fromEntries(SETS.map((x) => [x.id, x]));
