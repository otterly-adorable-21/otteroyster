// World lore: the pond's residents, their stories, and the mysteries that tie
// the map together. Shared by the website and the Discord bot.
//
// Mystery chapters are solved by investigating at a place under the right
// conditions (time of day, weather, tide, things you've found, friendships).

export const NPCS = {
  willow: {
    name: 'Grandma Willow', icon: '👵', species: 'Elder river otter', home: 'willow',
    about: 'The oldest otter on the pond. She remembers when the lighthouse was built and knows a story for every stone.',
    lines: {
      any: ['Come, sit. The willows are whispering again.', 'Every otter has a story. Yours is only just beginning, dear.', 'My grandmother taught me to float before I could swim. Or was it the other way round?', 'Mind the roots. They were here long before any of us.'],
      rainy: ['Rain is just the sky remembering the sea.', 'Hear that? The pond drinks the rain like tea.'],
      misty: ['On misty mornings the old stories walk about. Keep your eyes open.'],
      night: ['Up late, are we? So was I, at your age.'],
    },
    pages: [
      { title: 'How the Pond Was Born', text: 'Long ago a river ran to the sea without stopping. One stubborn beaver built a dam to sit and watch the sunset, and the water pooled behind it. The beaver is long gone, but the pond stayed, and so did everyone who came to watch the sunset with him.' },
      { title: 'The First Otters', text: 'The first river otters came up the stream chasing a silver fish they never caught. The first sea otters came in on a storm, holding paws so they would not drift apart. They argued about everything for a whole summer, then decided the pond was big enough for both.' },
      { title: "Willow's Promise", text: 'When I was a pup I promised the old lighthouse keeper I would tell every new otter the stories, so none of them would be lost. Now you know them too. That means the promise is yours as well, dear.' },
    ],
  },
  barnacle: {
    name: 'Captain Barnacle', icon: '🦀', species: 'Hermit crab sailor', home: 'shipwreck',
    about: 'A retired sailor who lives in the bow of the old wreck and trades curiosities from his little boat.',
    lines: {
      any: ['Ahoy, small one! Mind the barnacles, they bite. Not really. Well, a little.', "This wreck? The Saltwind. Finest ship that ever sank. I'd know, I was aboard.", "I've had eleven shells. This one's the best. Don't tell the other ten.", 'A sailor never says goodbye. Just "see you at low tide."'],
      rainy: ['Rain! Proper sailing weather. Hand me my hat.'],
      breezy: ['Smell that wind? Something is coming in on the tide.'],
      night: ['The stars are a map, if you know how to read them.'],
    },
    pages: [
      { title: 'The Saltwind', text: 'The Saltwind was a merchant ship carrying lanterns, maps and one very large wheel of cheese. A storm drove her onto the rocks the same night the lighthouse went dark. Nobody was hurt. The cheese was never found.' },
      { title: 'Eleven Shells', text: 'A hermit crab is only ever borrowing a home. Barnacle says this is the secret to a happy life: never hold on to anything so tightly you cannot move house when you grow.' },
      { title: "The Captain's Map", text: 'Before she sank, the Saltwind carried a map of the whole coast with one spot marked only "where the moon sleeps." Barnacle tore the corner off as a souvenir. He still has it. He will not say where.' },
    ],
  },
  lumen: {
    name: 'Old Lumen', icon: '🪶', species: 'Grey heron, lighthouse keeper', home: 'lighthouse',
    about: 'A patient heron who keeps the lighthouse lamp burning and counts the ships that pass.',
    lines: {
      any: ['The lamp does not care if anyone is watching. It shines anyway.', 'I have counted four thousand, two hundred and six ships. And one very confused duck.', 'Stand still long enough and the fish forget you are there.'],
      misty: ['Fog is when the lamp matters most.'],
      night: ['Shh. The lamp is working.', 'Every night I light it, I think of the night it went dark.'],
      dawn: ['Dawn. Time to rest my eyes, and polish the lens.'],
    },
    pages: [
      { title: 'The Keeper Before', text: 'Before Lumen there was Ember, a sea otter who kept the lamp with a pocket full of flint. Ember taught Lumen everything, then one spring swam out to see where the ships were going. Lumen still keeps her chair by the window.' },
      { title: 'The Lens', text: 'The lighthouse lens is made of a thousand pieces of polished sea glass, collected one by one by the pond folk. If you hold a piece of sea glass to your eye at dusk, you can see the light the way the ships do.' },
      { title: 'Why Herons Wait', text: 'Herons are not slow. They are simply very sure that good things come to those who stand perfectly still in cold water. Lumen says this works for friendship, too.' },
    ],
  },
  shellby: {
    name: 'Curator Shellby', icon: '🐢', species: 'Sea turtle scholar', home: 'museum',
    about: 'Runs the Pond Museum with great care and a very small pair of spectacles.',
    lines: {
      any: ['Every find tells a story. Most of them say "I was under a rock."', 'Please do not lick the exhibits. Yes, again.', 'The museum belongs to everyone. Every donation makes it ours a little more.'],
      rainy: ['Rainy days are museum days. Come in, come in.'],
      night: ['The museum is closed, but I am not tired. Turtles rarely are.'],
    },
    pages: [
      { title: 'A Hundred Years of Swimming', text: 'Shellby is one hundred and four years old and has swum to every reef on the coast twice. On the third trip she decided the best treasures were the ones you could share, and came home to start the museum.' },
      { title: 'The Empty Case', text: 'One display case in the museum has always been empty. The label says only "The Moon Pearl. Expected soon." Shellby polishes the glass every morning.' },
      { title: "The Curator's Rule", text: 'Shellby has one rule: nothing goes in the museum unless somebody loved it first. That is why the first donor of every find is remembered forever.' },
    ],
  },
  marina: {
    name: 'Marina', icon: '🦭', species: 'Harbor seal lifeguard', home: 'tidepools',
    about: 'Patrols the shallows, follows the tide and knows every rock pool by name.',
    lines: {
      any: ['Swim safe! Buddy system, always.', 'I named that rock Gerald. Say hi to Gerald.', 'The sea is big, but it is never lonely if you know where to look.'],
      rainy: ['Rain makes the pools sing. Listen at the edges.'],
      breezy: ['Waves are up today. Stay where you can touch the bottom!'],
      dawn: ['First swim of the day is the best one.'],
    },
    pages: [
      { title: 'The Tide Keeper', text: 'Marina believes the tide is the sea breathing. Twice a day it breathes out and leaves little gifts in the pools, and twice a day it breathes in and takes back whatever nobody needed.' },
      { title: 'The Song in the Rocks', text: 'Sometimes, at dawn, the reef hums. Marina has heard it since she was a pup. The old seals say it is a shell somewhere out there that remembers a song.' },
      { title: 'Buddy System', text: 'Marina once got lost in the fog and found her way home by following a sea otter who was humming. She never learned who it was. That is why she says hello to everyone.' },
    ],
  },
  pip: {
    name: 'Pip', icon: '🕊️', species: 'Postal gull', home: 'lilypond',
    about: 'Carries Shell Mail all over the coast, gossips constantly and is always slightly late.',
    lines: {
      any: ['Mail! Mail! Nope, not for you. Sorry!', 'Did you hear? No? Good, because I forgot what it was.', 'I fly four hundred miles a week. My feet are VERY tired.', 'Sea otters write long letters. River otters write fast ones. I carry both!'],
      rainy: ['Soggy letters again! Ugh!'],
      night: ['Even gulls sleep. Mostly. Zzz… MAIL!'],
    },
    pages: [
      { title: 'The Undelivered Letter', text: 'Pip has carried one letter for three years without finding its owner. It is addressed "To whoever finds the Moon Pearl." Pip is not allowed to open it. Pip has thought about it a lot.' },
      { title: 'How Shell Mail Began', text: 'A lonely sea otter once tied a note to a gull who was going that way anyway. The note said "Is anyone out there?" It came back with forty replies. That was the first Shell Mail.' },
      { title: "Pip's Secret", text: 'Pip is afraid of heights. Pip has decided not to think about this.' },
    ],
  },
  whisper: {
    name: 'The Whisper', icon: '🌙', species: '???', home: 'trench', night: true,
    about: 'A soft glow deep in the Moonlit Trench that only speaks after dark.',
    lines: {
      any: ['…you came…', '…the moon remembers you…', '…not yet… not yet…', '…listen to the deep…'],
    },
    pages: [
      { title: 'The Glow Below', text: 'Nobody knows what lives at the bottom of the trench. The glow is kind, and it knows things it should not, like your name, and what you had for breakfast.' },
      { title: 'Moonfall', text: 'Once in a very long while, the moon drops a single pearl into the sea. It sinks to the trench and waits for someone patient enough to find it.' },
      { title: 'Ember', text: '…the keeper who swam away… she found us… she is safe… tell the heron…' },
    ],
  },
};

export const NPC_IDS = Object.keys(NPCS);
export const NPC_PAGE_AT = [2, 5, 9]; // friendship needed for each of an NPC's pages
export const NPC_MAX = 10;

// ---------- mysteries ----------
// need: { place, phase?, weather?, tide?, find?, npc?: [id, friendship], level?, harvest? }
export const MYSTERIES = [
  {
    id: 'lighthouse', name: 'The Lighthouse That Went Dark', icon: '🗼', npc: 'lumen', level: 2,
    intro: 'Old Lumen says the lamp once went dark for a whole night, the night the Saltwind sank. Nobody ever found out why.',
    reward: { pearls: 150, xp: 40, title: 'Lightkeeper' },
    chapters: [
      { hint: 'Visit the lighthouse at night and make friends with Old Lumen.', need: { place: 'lighthouse', phase: 'night', npc: ['lumen', 1] }, text: 'Inside the lamp room you find scratch marks on the floor, and a tuft of sea otter fur caught on the door.' },
      { hint: 'Search the Tide Pools at low tide. You will need an old lens.', need: { place: 'tidepools', tide: 'low', find: 'lens' }, text: 'Between the rocks lies a brass gear stamped with a flame, from the lighthouse clockwork. Someone carried it here.' },
      { hint: 'Ask Captain Barnacle at the Shipwreck on a rainy day.', need: { place: 'shipwreck', weather: 'rainy', npc: ['barnacle', 1] }, text: '"That gear? Ember gave it to me the night of the storm," says Barnacle. "Said she had to stop the lamp to see the stars. Said she was following a light in the sea."' },
      { hint: 'Return to the lighthouse at dusk and tell Lumen what you learned.', need: { place: 'lighthouse', phase: 'dusk' }, text: 'Lumen is quiet for a long time. "She saw the Whisper," he says at last. "She went to find it." He lights the lamp a little brighter tonight.' },
    ],
  },
  {
    id: 'song', name: 'The Singing Shell', icon: '🐚', npc: 'marina', level: 3,
    intro: 'At dawn the reef hums a tune that nobody can place. Marina wants to know where it comes from.',
    reward: { pearls: 150, xp: 40, title: 'Songkeeper' },
    chapters: [
      { hint: 'Listen at Pearl Reef at dawn.', need: { place: 'reef', phase: 'dawn' }, text: 'The humming is real. It rises and falls with the waves, three notes, again and again.' },
      { hint: 'Find a spiral shell at the Tide Pools and bring it to Marina.', need: { place: 'tidepools', find: 'spiral', npc: ['marina', 2] }, text: 'Held to your ear, the spiral shell hums the same three notes. Marina gasps. "It is the song from my story!"' },
      { hint: 'Follow the song across the Lily Pond on a misty day.', need: { place: 'lilypond', weather: 'misty' }, text: 'In the mist you hear someone humming back, an old otter voice. It is Grandma Willow, sitting on a lily pad.' },
      { hint: 'Ask Grandma Willow in the Willow Grove.', need: { place: 'willow', npc: ['willow', 2] }, text: '"Ember used to hum that," Willow says softly. "She taught it to the whole pond, so we could find each other in the fog." Now you know it too.' },
    ],
  },
  {
    id: 'recipe', name: "Grandma Willow's Lost Recipe", icon: '🥧', npc: 'willow', level: 4,
    intro: "Grandma Willow's famous acorn-and-berry pie recipe blew away in a storm. She remembers only the first line.",
    reward: { pearls: 120, xp: 35, title: 'Pie Whisperer' },
    chapters: [
      { hint: 'Find an acorn in the Willow Grove on a sunny day.', need: { place: 'willow', weather: 'sunny', find: 'acorn' }, text: 'Under the biggest willow you find a scrap of paper pinned by an acorn: "Two acorns, ground fine…"' },
      { hint: 'Grow and harvest some pond berries in your garden, then look by the Lily Pond.', need: { place: 'lilypond', harvest: 3 }, text: 'A second scrap is stuck to a lily pad: "…a cup of pond berries, warm from the sun…"' },
      { hint: 'Pip may have seen the last page. Find Pip at the Lily Pond during the day.', need: { place: 'lilypond', phase: 'day', npc: ['pip', 2] }, text: '"Oh! THAT paper! I thought it was mail!" Pip hands over the last scrap, slightly pecked: "…and bake it for someone you love."' },
      { hint: 'Bring the recipe back to Willow at dusk.', need: { place: 'willow', phase: 'dusk' }, text: 'Willow bakes the pie at once, and the whole grove smells of berries. She cuts the first slice for you.' },
    ],
  },
  {
    id: 'moon', name: 'The Moon Pearl', icon: '🌕', npc: 'whisper', level: 10, after: ['lighthouse', 'song'],
    intro: 'An empty museum case, a letter nobody can deliver, a keeper who swam away. Everything points to the Moonlit Trench.',
    reward: { pearls: 400, xp: 100, title: 'Moon-Touched' },
    chapters: [
      { hint: 'Visit the Moonlit Trench at night.', need: { place: 'trench', phase: 'night' }, text: '"…you came…" The glow brightens. "…bring a piece of the moon, and you may see her…"' },
      { hint: 'Find a moon shard in the trench.', need: { place: 'trench', find: 'moonshard' }, text: 'The moon shard glows in your paws, warm as a sunny rock. The Whisper hums the three-note song.' },
      { hint: 'Show Captain Barnacle the shard. He has the other half of a map.', need: { place: 'shipwreck', npc: ['barnacle', 4] }, text: 'Barnacle unfolds the torn corner of the Saltwind map. Held up to the shard, a path appears: the Lily Pond, under a clear night sky.' },
      { hint: 'Go to the Lily Pond on a clear (sunny) night.', need: { place: 'lilypond', phase: 'night', weather: 'sunny' }, text: 'The moon shines on the water and the pond lights up from below. A pearl rises, pale and glowing, and beside it a note in Ember\'s pawwriting: "I found the light. I am happy. Look after them for me." Shellby\'s empty case will not be empty any more.' },
    ],
  },
];

export const MYSTERY = Object.fromEntries(MYSTERIES.map((m) => [m.id, m]));

// Every page of the Lore Book (for the Scholar mastery and the book view).
export const PLACE_LORE = {
  lilypond: 'The heart of the pond, where the first sunset-watchers sat. The lilies close at night and open again whenever someone laughs nearby.',
  willow: 'The willows here are older than the lighthouse. Their roots hold the bank together, and their branches hold most of the pond\'s gossip.',
  tidepools: 'Twice a day the sea leaves its pockets full of little treasures here. Marina knows every pool by name.',
  lighthouse: 'Built by the pond folk with sea glass and patience. Its lamp has gone dark only once.',
  shipwreck: 'The Saltwind ran aground here in a storm. Now it is a home for crabs, fish and one retired captain.',
  reef: 'A garden of coral that hums at dawn. The pearls here are said to be the reef\'s way of saying thank you.',
  trench: 'The deepest, darkest place on the map, and somehow also the kindest. Something down there glows.',
};

export const TOTAL_PAGES = MYSTERIES.reduce((n, m) => n + m.chapters.length, 0) + NPC_IDS.length * NPC_PAGE_AT.length + Object.keys(PLACE_LORE).length;
