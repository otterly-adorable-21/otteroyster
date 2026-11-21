// Growing up: life stages that unlock things (never take them away), birthdays,
// tricks and stories. Shared by the website and the Discord bot.

export const STAGES = [
  { id: 'pup', name: 'Pup', icon: '🌱', level: 1, scale: 0.84, item: 'pupbib', unlock: 'A Pup Bib to wear' },
  { id: 'young', name: 'Young Otter', icon: '🌿', level: 5, scale: 0.92, item: 'backpack', unlock: 'Story time together, and an Explorer Backpack' },
  { id: 'grown', name: 'Grown Otter', icon: '🌊', level: 10, scale: 1, item: 'sailorcap', unlock: 'Learning tricks, and a Sailor Cap' },
  { id: 'wise', name: 'Wise Otter', icon: '🦉', level: 20, scale: 1, item: 'wisespecs', unlock: 'Sharing wisdom, and Wise Spectacles' },
];

export function stageOf(level) {
  let st = STAGES[0];
  for (const s of STAGES) if (level >= s.level) st = s;
  return st;
}
export const nextStage = (level) => STAGES.find((s) => s.level > level) || null;
export const stageAtLeast = (level, id) => level >= STAGES.find((s) => s.id === id).level;

export const TRICKS = [
  { id: 'rollover', name: 'Roll over', icon: '🔄' },
  { id: 'juggle', name: 'Juggle a pebble', icon: '🪨' },
  { id: 'handstand', name: 'Handstand', icon: '🤸' },
  { id: 'twirl', name: 'Water twirl', icon: '🌀' },
];

export const STORIES = [
  (n, s) => `${n} listens wide-eyed to the tale of the otter who found a pearl as big as the moon. 🌕`,
  (n, s) => `You tell ${n} about the brave crab who guarded the Tide Pools. ${n} squeaks at the scary part! 🦀`,
  (n, s) => `${n} falls asleep halfway through the story of the singing whale… and smiles. 🐋`,
  (n, s) => `${n} giggles at the story of the seagull who lost their hat at ${s.place}. 🐦`,
  (n, s) => `You read about the secret garden under the lily pads. ${n} wants to go look for it right now! 🪷`,
  (n, s) => `${n} asks for the story about ${s.snack} for the third time today. It's a good one. 😋`,
];

export const WISDOM = [
  'The tide always comes back. So do good friends. 🌊',
  'A shared snack tastes twice as sweet. 🍰',
  'Hold paws so you never drift apart. 🦦💕🦦',
  "Every pearl starts as a tiny grain of sand. Don't give up! 🦪",
  "Rest is part of the adventure. Naps count! 😴",
  'The best treasure is the one you find with a friend. 🗺️',
];

// ---------- birthdays (month-day, UTC) ----------
export const mdOf = (ms) => new Date(ms).toISOString().slice(5, 10); // "MM-DD"
export const isBirthday = (s, now = Date.now()) => !!s.birthday && mdOf(now) === s.birthday;
export function nextBirthday(s, now = Date.now()) {
  if (!s.birthday) return null;
  const [m, d] = s.birthday.split('-').map(Number);
  const y = new Date(now).getUTCFullYear();
  let at = Date.UTC(y, m - 1, d);
  if (at + 86400000 <= now) at = Date.UTC(y + 1, m - 1, d);
  return at;
}
export const birthdayLabel = (md) => {
  const [m, d] = md.split('-').map(Number);
  return new Date(Date.UTC(2000, m - 1, d)).toLocaleDateString([], { month: 'long', day: 'numeric', timeZone: 'UTC' });
};
