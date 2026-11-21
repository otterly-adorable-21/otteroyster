// Friendship levels and social limits, shared by the website and the Discord bot.

export const FRIEND_LEVELS = [
  { min: 0, name: 'Acquaintance', hearts: 1 },
  { min: 6, name: 'Pond Pal', hearts: 2 },
  { min: 18, name: 'Good Buddy', hearts: 3 },
  { min: 40, name: 'Best Friend', hearts: 4 },
  { min: 80, name: 'Soulmate Otters', hearts: 5 },
];

export const FRIEND_POINTS = { visit: 1, hug: 2, gift: 3, challenge: 2 };
export const HUG_HAPPINESS = 8;
export const GIFT_PEARLS_PER_DAY = 100;
export const GIFT_PEARL_OPTIONS = [10, 25, 50];
export const MAX_FRIENDS = 100;

export function friendLevel(points = 0) {
  let lvl = FRIEND_LEVELS[0];
  for (const l of FRIEND_LEVELS) if (points >= l.min) lvl = l;
  const next = FRIEND_LEVELS.find((l) => l.min > points);
  return { ...lvl, points, next: next ? next.min : null };
}

export const heartsText = (points) => {
  const l = friendLevel(points);
  return '💗'.repeat(l.hearts) + '🤍'.repeat(5 - l.hearts);
};

// Shell Mail postcard designs.
export const POSTCARD_ART = {
  pond: { name: 'Lily Pond', icon: '🪷' },
  lighthouse: { name: 'Lighthouse', icon: '🗼' },
  reef: { name: 'Pearl Reef', icon: '🐠' },
  moon: { name: 'Moonlit Night', icon: '🌙' },
};
