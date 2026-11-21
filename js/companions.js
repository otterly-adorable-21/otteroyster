// Pet companions: little pond friends that tag along with your otter.
// Each has a perk that switches on once you've bonded (bond >= BOND_PERK).
// Shared by the website and the Discord bot.

export const BOND_PERK = 25;
export const BOND_MAX = 100;
export const PLAY_COOLDOWN = 2 * 3600000;
export const TREAT_PRICE = 5;
export const BOND_DECAY_PER_DAY = 6; // only after a day without play

export const COMPANIONS = {
  duckling: { name: 'Duckling', icon: '🐥', price: 80, level: 1, perk: 'Your otter gets lonely 20% slower', desc: 'Peeps happily and follows your otter everywhere.' },
  crab: { name: 'Hermit Crab', icon: '🦀', price: 120, level: 2, perk: '+25% pearls found while exploring', desc: 'Always shopping for a fancier shell.' },
  frog: { name: 'Lily Frog', icon: '🐸', price: 150, level: 3, perk: 'Rare discoveries are 15% more likely', desc: 'Has a nose for treasure. And flies.' },
  turtle: { name: 'Sea Turtle', icon: '🐢', price: 200, level: 4, perk: 'Missions finish 15% faster', desc: 'Slow and steady, but knows every shortcut.' },
  starfish: { name: 'Starfish', icon: '⭐', price: 220, level: 5, perk: '+10% pearls from arcade games', desc: 'Cheers loudly (for a starfish).' },
  seahorse: { name: 'Seahorse', icon: '🐴', price: 260, level: 6, perk: 'Garden plants grow 20% faster', desc: 'Loves tending the garden.' },
  firefly: { name: 'Firefly', icon: '✨', price: 300, level: 8, perk: '+4 den coziness', desc: 'A tiny night-light with wings.' },
  octopus: { name: 'Baby Octopus', icon: '🐙', price: 400, level: 10, perk: 'Naps restore energy 20% faster', desc: 'Gives the best eight-armed hugs.' },
};

export const COMPANION_IDS = Object.keys(COMPANIONS);

export const bondLevel = (bond) => (bond >= 90 ? 5 : bond >= 65 ? 4 : bond >= 40 ? 3 : bond >= BOND_PERK ? 2 : 1);
export const BOND_NAMES = ['', 'New friends', 'Buddies', 'Close pals', 'Best friends', 'Inseparable'];
