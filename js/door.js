// Front door decorations, shown on your house on Otter Lane and on the Den tab.
// One of each kind can be up at a time. Each piece adds a little coziness.
// Shared by the website and the server.

export const DOOR_KINDS = [
  { id: 'paint', name: 'Door paint', icon: '🎨' },
  { id: 'wreath', name: 'Wreaths', icon: '💐' },
  { id: 'mat', name: 'Welcome mats', icon: '🟫' },
  { id: 'lights', name: 'Lights', icon: '🏮' },
  { id: 'plant', name: 'Porch plants', icon: '🪴' },
];

export const DOOR_ITEMS = {
  // paint (color = the drawn door color)
  'paint-moss': { kind: 'paint', name: 'Moss Green', price: 0, color: '#4f6b4a' },
  'paint-sky': { kind: 'paint', name: 'Sky Blue', price: 20, color: '#5c9fc4' },
  'paint-coral': { kind: 'paint', name: 'Coral Pink', price: 20, color: '#d98c7a' },
  'paint-butter': { kind: 'paint', name: 'Butter Yellow', price: 20, color: '#e6c25a' },
  'paint-lilac': { kind: 'paint', name: 'Lilac', price: 25, color: '#a58cc9' },
  'paint-night': { kind: 'paint', name: 'Midnight', price: 30, color: '#263b5e' },
  'paint-cherry': { kind: 'paint', name: 'Cherry Red', price: 30, color: '#b8433f' },
  // wreaths
  'wreath-lily': { kind: 'wreath', name: 'Lily Wreath', price: 40, icon: '🪷', colors: ['#6f9a3a', '#fffaf0'] },
  'wreath-shell': { kind: 'wreath', name: 'Seashell Wreath', price: 50, icon: '🐚', colors: ['#e8d6a8', '#f4e6f0'] },
  'wreath-starfish': { kind: 'wreath', name: 'Starfish Wreath', price: 60, icon: '⭐', colors: ['#3f6a2a', '#ff9e7a'] },
  'wreath-berry': { kind: 'wreath', name: 'Pinecone & Berry', price: 60, icon: '🫐', colors: ['#3f6a2a', '#c92a2a'] },
  'wreath-heart': { kind: 'wreath', name: 'Heart Wreath', price: 70, icon: '💗', colors: ['#f783ac', '#fff0f6'] },
  // mats
  'mat-welcome': { kind: 'mat', name: 'Welcome Mat', price: 25, icon: '🟫', colors: ['#a8865f', '#fff3bf'] },
  'mat-shell': { kind: 'mat', name: 'Shell Mat', price: 35, icon: '🐚', colors: ['#3cc7c0', '#fffaf0'] },
  'mat-paw': { kind: 'mat', name: 'Paw Print Mat', price: 35, icon: '🐾', colors: ['#6b4d34', '#e8d6a8'] },
  'mat-rainbow': { kind: 'mat', name: 'Rainbow Mat', price: 50, icon: '🌈', colors: ['#ff8787', '#74c0fc'] },
  // lights
  'lights-lantern': { kind: 'lights', name: 'Pearl Lantern', price: 45, icon: '🏮', colors: ['#fff3bf', '#d9b45a'] },
  'lights-fairy': { kind: 'lights', name: 'Fairy Lights', price: 55, icon: '✨', colors: ['#fff3bf', '#ffd43b'] },
  'lights-firefly': { kind: 'lights', name: 'Firefly Jar', price: 65, icon: '🫙', colors: ['#e6ff9c', '#9be8de'] },
  // plants
  'plant-fern': { kind: 'plant', name: 'Potted Fern', price: 30, icon: '🌿', colors: ['#6f9a3a', '#a8865f'] },
  'plant-sunflower': { kind: 'plant', name: 'Sunflower Pot', price: 40, icon: '🌻', colors: ['#ffd43b', '#a8865f'] },
  'plant-mushroom': { kind: 'plant', name: 'Mushroom Cluster', price: 40, icon: '🍄', colors: ['#d9635b', '#fffaf0'] },
  'plant-cattail': { kind: 'plant', name: 'Cattails', price: 35, icon: '🌾', colors: ['#6b4d34', '#7fa65a'] },
};

export const DOOR_COZY = 1; // per decoration (paint not counted)
export const defaultDoor = () => ({ paint: 'paint-moss', wreath: null, mat: null, lights: null, plant: null });
export const doorColor = (door) => DOOR_ITEMS[door?.paint]?.color || '#4f6b4a';
