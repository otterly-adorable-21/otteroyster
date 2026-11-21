import { MessageFlags } from 'discord.js';

export const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export function weighted(list) {
  let r = Math.random() * list.reduce((n, x) => n + x.weight, 0);
  return list.find((x) => (r -= x.weight) < 0) || list[0];
}

export const EPHEMERAL = MessageFlags.Ephemeral;
export const whisper = (i, content) => (i.replied || i.deferred
  ? i.followUp({ content, flags: EPHEMERAL })
  : i.reply({ content, flags: EPHEMERAL }));

// Only the person who started a solo game may press its buttons.
export function notYours(i, s) {
  if (i.user.id === s.owner) return false;
  whisper(i, "That's someone else's game! Start your own with `/play`.");
  return true;
}

export const mention = (id) => `<@${id}>`;
export const LETTERS = ['🇦', '🇧', '🇨', '🇩'];
