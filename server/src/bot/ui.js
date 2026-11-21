// Discord UI helpers: embeds, buttons, the pet picture.
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { otterSVG } from '../../../js/otter.js';
import { STAT_INFO, mood, coziness, COZY_MAX, personaInfo } from '../../../js/core.js';
import { denSVG } from '../../../js/den.js';

export const COLOR = 0x1f8f95;
export const GOLD = 0xd9b45a;
export const GREEN = 0x6f9a3a;
export const RED = 0xfa5252;

export function embed(title, description, color = COLOR) {
  const e = new EmbedBuilder().setColor(color);
  if (title) e.setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

// btn(customId, label, style?, { emoji, disabled })
export function btn(id, label, style = ButtonStyle.Secondary, opts = {}) {
  const b = new ButtonBuilder().setCustomId(id).setStyle(style);
  if (label) b.setLabel(label);
  if (opts.emoji) b.setEmoji(opts.emoji);
  if (opts.disabled) b.setDisabled(true);
  return b;
}
export const linkBtn = (url, label) => new ButtonBuilder().setURL(url).setLabel(label).setStyle(ButtonStyle.Link);
export const row = (...components) => new ActionRowBuilder().addComponents(...components);
export { ButtonStyle };

export function select(id, placeholder, options, { min = 1, max = 1, disabled = false } = {}) {
  return new StringSelectMenuBuilder().setCustomId(id).setPlaceholder(placeholder)
    .setMinValues(min).setMaxValues(max).setDisabled(disabled)
    .addOptions(options.slice(0, 25));
}

export function textModal(id, title, label, { placeholder = '', min = 1, max = 30 } = {}) {
  return new ModalBuilder().setCustomId(id).setTitle(title).addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId('answer').setLabel(label).setStyle(TextInputStyle.Short)
        .setMinLength(min).setMaxLength(max).setPlaceholder(placeholder).setRequired(true),
    ),
  );
}

export function bar(v, n = 10) {
  const filled = Math.round((Math.max(0, Math.min(100, v)) / 100) * n);
  const c = v < 25 ? '🟥' : v < 55 ? '🟨' : '🟩';
  return c.repeat(filled) + '⬛'.repeat(n - filled);
}

export function statLines(s) {
  return STAT_INFO.map((st) => `${st.icon} \`${st.label.padEnd(6)}\` ${bar(s.stats[st.id])} **${Math.round(s.stats[st.id])}**`).join('\n');
}

export function moodLine(s) {
  if (s.mission) return '🧭 Out exploring!';
  if (s.sleeping) return '💤 Fast asleep';
  const m = mood(s);
  return m === 'happy' ? '😊 Happy as a clam' : m === 'sad' ? '🥺 Needs some love' : '🙂 Doing okay';
}

// ----- pet picture (PNG via resvg if installed) -----
let Resvg = null;
try {
  ({ Resvg } = await import('@resvg/resvg-js'));
} catch {
  console.warn('[bot] @resvg/resvg-js not available; pet pictures disabled.');
}

const PAD = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0,0 L${r * 0.12},${-r} A${r},${r} 0 1,1 ${-r * 0.12},${-r} Z" fill="#6f9a3a"/><path d="M0,0 L${-r * 0.7},${-r * 0.7} M0,0 L${-r},0 M0,0 L${-r * 0.6},${r * 0.8} M0,0 L${r * 0.1},${r} M0,0 L${r * 0.8},${r * 0.6} M0,0 L${r},${-r * 0.1}" stroke="#3f6a2a" stroke-width="1.5" opacity=".45"/></g>`;
const LILY = (x, y, k) => {
  let petals = '';
  for (const a of [-80, -56, -32, -10, 10, 32, 56, 80]) petals += `<path transform="rotate(${a})" d="M0,0 C-7,-9 -5,-27 0,-33 C5,-27 7,-9 0,0Z"/>`;
  return `<g transform="translate(${x} ${y}) scale(${k})"><g fill="#fffaf0" stroke="#e3d8c2" stroke-width=".8">${petals}</g><ellipse cx="0" cy="-6" rx="9" ry="7" fill="#f2b632"/></g>`;
};
const STAR = (x, y, r) => `<path d="M${x},${y - r} C${x + r * 0.15},${y - r * 0.15} ${x + r * 0.15},${y - r * 0.15} ${x + r},${y} C${x + r * 0.15},${y + r * 0.15} ${x + r * 0.15},${y + r * 0.15} ${x},${y + r} C${x - r * 0.15},${y + r * 0.15} ${x - r * 0.15},${y + r * 0.15} ${x - r},${y} C${x - r * 0.15},${y - r * 0.15} ${x - r * 0.15},${y - r * 0.15} ${x},${y - r}Z" fill="#f3d98c"/>`;

function sceneSVG(s) {
  const night = s.sleeping;
  const otter = s.mission ? '' : `<svg x="140" y="28" width="200" height="250" viewBox="0 -20 200 250" overflow="visible">${otterSVG(s)}</svg>`;
  const away = s.mission
    ? '<g fill="#fff" opacity=".8"><circle cx="240" cy="170" r="10"/><circle cx="260" cy="140" r="7"/><circle cx="248" cy="114" r="5"/><circle cx="264" cy="94" r="4"/></g><ellipse cx="240" cy="190" rx="60" ry="14" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>'
    : '<ellipse cx="240" cy="262" rx="78" ry="14" fill="#fff" opacity=".18"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300" viewBox="0 0 480 300">
    <defs><radialGradient id="w" cx="50%" cy="55%" r="75%"><stop offset="0" stop-color="#9be8de"/><stop offset=".35" stop-color="#3cc7c0"/><stop offset=".75" stop-color="#1f8f95"/><stop offset="1" stop-color="#0c3440"/></radialGradient>
    <clipPath id="c"><rect width="480" height="300" rx="28"/></clipPath></defs>
    <g clip-path="url(#c)">
      <rect width="480" height="300" fill="url(#w)"/>
      <g fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="2"><circle cx="240" cy="200" r="70"/><circle cx="240" cy="200" r="120"/><circle cx="240" cy="200" r="180"/></g>
      <g stroke-linecap="round" fill="none"><path d="M20,-5 Q34,60 18,120" stroke="#3f6a2a" stroke-width="6" stroke-dasharray="2 9"/><path d="M44,-5 Q52,50 42,92" stroke="#8fbf4a" stroke-width="6" stroke-dasharray="2 9"/>
      <path d="M440,-5 Q430,60 446,118" stroke="#3f6a2a" stroke-width="6" stroke-dasharray="2 9"/><path d="M414,-5 Q420,44 408,84" stroke="#c4de7a" stroke-width="6" stroke-dasharray="2 9"/></g>
      ${PAD(40, 290, 70, -20)}${PAD(450, 300, 66, 40)}${PAD(400, 170, 26, -70)}${PAD(76, 170, 22, 20)}
      ${LILY(52, 262, 1.3)}${LILY(436, 270, 1.1)}${LILY(400, 162, 0.6)}
      ${STAR(120, 40, 7)}${STAR(372, 30, 9)}${STAR(330, 70, 5)}
      ${away}${otter}
      ${night ? '<rect width="480" height="300" fill="#071f26" opacity=".5"/><circle cx="410" cy="50" r="22" fill="#fff3bf"/><circle cx="420" cy="44" r="20" fill="#1a3a48"/>' : ''}
      <rect x="2" y="2" width="476" height="296" rx="27" fill="none" stroke="#d9b45a" stroke-width="3"/>
    </g></svg>`;
}

export function petAttachment(s) {
  if (!Resvg) return null;
  try {
    const png = new Resvg(sceneSVG(s), { fitTo: { mode: 'width', value: 480 } }).render().asPng();
    return new AttachmentBuilder(png, { name: 'otter.png' });
  } catch (err) {
    console.error('render failed', err);
    return null;
  }
}

// Embed + file for showing an otter. Pass {files, embeds} straight into a reply.
export function petCard(s, { title, extra = '', footer } = {}) {
  const e = embed(title ?? `${s.name} 🦦`, `**Level ${s.level}**  ·  ${moodLine(s)}\n${statLines(s)}${extra ? `\n\n${extra}` : ''}`);
  e.addFields({ name: 'Pearls', value: `⚪ ${s.pearls}`, inline: true }, { name: 'XP', value: `${s.xp}/${40 + s.level * 30}`, inline: true });
  const pi = personaInfo(s);
  e.addFields(
    { name: 'Personality', value: pi.trait ? `${pi.trait.icon} **${pi.trait.name}**${pi.also ? ` (and a bit ${pi.also.icon} ${pi.also.name.toLowerCase()})` : ''}\n*${pi.trait.perk}*` : '🌱 Still discovering who they are…', inline: false },
    { name: 'Favorites', value: `${pi.fav.snack.icon} ${pi.fav.snack.name} · ${pi.fav.place.icon} ${pi.fav.place.name} · ${pi.fav.game.icon} ${pi.fav.game.name}`, inline: false },
  );
  if (footer) e.setFooter({ text: footer });
  const file = petAttachment(s);
  if (file) e.setImage('attachment://otter.png');
  return { embeds: [e], files: file ? [file] : [], attachments: [] };
}

// Picture of an otter's den (same drawing as the website).
export function denCard(s, { title } = {}) {
  const c = coziness(s);
  const e = embed(title ?? `🏡 ${s.name}'s Den`, `✨ Coziness **${c}/${COZY_MAX}** ${'★'.repeat(Math.round((c / COZY_MAX) * 5))}${'☆'.repeat(5 - Math.round((c / COZY_MAX) * 5))}\n🛋️ ${s.den.items.length} things placed${s.mission ? ' · the owner is out exploring' : s.sleeping ? ' · shh, napping' : ''}`);
  let file = null;
  if (Resvg) {
    try {
      const png = new Resvg(denSVG(s), { fitTo: { mode: 'width', value: 800 } }).render().asPng();
      file = new AttachmentBuilder(png, { name: 'den.png' });
      e.setImage('attachment://den.png');
    } catch (err) { console.error('den render failed', err); }
  }
  return { embeds: [e], files: file ? [file] : [], attachments: [] };
}
