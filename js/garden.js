// The garden outside the den: plant seeds, water them, harvest pearls and
// snacks for the pantry. Rain waters everything for you; friends can water too
// (a friend-watered plant gives a bonus). Shared by the website and Discord.

export const PLOT_LEVELS = [1, 1, 1, 4, 7, 10]; // plot n unlocks at this level

// minutes = growing time once watered. yields: pearls, xp, and/or pantry snacks.
export const CROPS = {
  sprouts: { name: 'Kelp Sprouts', icon: '🌱', seed: 5, minutes: 20, level: 1, pearls: 10, xp: 3, desc: 'Quick and easy. Ready in 20 minutes.' },
  seagrapes: { name: 'Sea Grapes', icon: '🍇', seed: 10, minutes: 60, level: 1, pantry: { clam: 3 }, xp: 6, desc: 'Fills the pantry with 3 clams.' },
  lily: { name: 'Water Lily', icon: '🪷', seed: 12, minutes: 90, level: 2, pearls: 30, xp: 8, desc: 'A pond classic. Sells for a pretty pearl.' },
  berries: { name: 'Pond Berries', icon: '🫐', seed: 15, minutes: 120, level: 3, pantry: { cake: 1, fish: 1 }, xp: 8, desc: 'Baked into an oyster cake, with a fish on the side.' },
  sunflower: { name: 'Sunflower', icon: '🌻', seed: 20, minutes: 240, level: 4, pearls: 60, xp: 14, desc: 'Grows tall in the sun. Big pearl payout.' },
  pumpkin: { name: 'Pumpkin', icon: '🎃', seed: 25, minutes: 360, level: 6, pantry: { cake: 3 }, xp: 18, desc: 'Three pumpkin oyster cakes!' },
  moonflower: { name: 'Moonflower', icon: '🌙', seed: 30, minutes: 480, level: 8, pearls: 110, xp: 24, desc: 'Blooms overnight. The most precious flower.' },
};

export const CROP_IDS = Object.keys(CROPS);
export const FRIEND_WATER_BONUS = 0.25; // +25% yield when a friend watered it

// Growth stage for drawing: 0 seed (needs water), 1 sprout, 2 growing, 3 ready.
export function plotStage(p, now = Date.now()) {
  if (!p?.crop) return -1;
  if (!p.wateredAt) return 0;
  const f = Math.min(1, (now - p.wateredAt) / Math.max(1, p.growMs));
  return f >= 1 ? 3 : f >= 0.45 ? 2 : 1;
}
export const plotReadyAt = (p) => (p?.wateredAt ? p.wateredAt + p.growMs : null);
