// Text content for Discord games. Add more lines freely; games pick at random.
// The quiz and word lists are shared with the website arcade (js/game-words.js).
export { TRIVIA, HANGMAN_WORDS, SCRAMBLE_WORDS, EMOJI, FISH } from '../../../js/game-words.js';

// Impostor: [majority word, impostor word]
export const IMPOSTOR_PAIRS = [
  ['Oyster', 'Clam'], ['Otter', 'Beaver'], ['Beach', 'Desert'], ['Shark', 'Dolphin'], ['Pirate', 'Sailor'],
  ['Pizza', 'Pie'], ['Lighthouse', 'Castle'], ['Snorkel', 'Scuba tank'], ['Pearl', 'Marble'], ['Ocean', 'Lake'],
  ['Pancakes', 'Waffles'], ['Guitar', 'Violin'], ['Penguin', 'Puffin'], ['Coffee', 'Hot chocolate'], ['Rain', 'Snow'],
  ['Cat', 'Fox'], ['Rocket', 'Airplane'], ['Volcano', 'Mountain'], ['Ice cream', 'Frozen yogurt'], ['Library', 'Bookstore'],
  ['Dragon', 'Dinosaur'], ['Bicycle', 'Scooter'], ['Camping', 'Picnic'], ['Wizard', 'Witch'], ['Sushi', 'Taco'],
  ['Moon', 'Sun'], ['Treasure chest', 'Piggy bank'], ['Crab', 'Lobster'], ['Kelp', 'Grass'], ['Seagull', 'Pigeon'],
  ['Birthday', 'Wedding'], ['Soccer', 'Basketball'], ['Hamster', 'Mouse'], ['Jellyfish', 'Octopus'], ['Boat', 'Submarine'],
];

export const WOULD_YOU_RATHER = [
  ['Be able to breathe underwater', 'Be able to fly'],
  ['Have an otter as a best friend', 'Have a dragon as a best friend'],
  ['Live in a lighthouse', 'Live in a treehouse'],
  ['Only eat pizza forever', 'Only eat ice cream forever'],
  ['Talk to animals', 'Speak every human language'],
  ['Explore the deep sea', 'Explore outer space'],
  ['Have a pet whale (in a giant pool)', 'Have a pet penguin'],
  ['Always be a little too hot', 'Always be a little too cold'],
  ['Have super speed', 'Be invisible'],
  ['Find a treasure chest', 'Find a magic map'],
  ['Never have homework again', 'Never have to do chores again'],
  ['Be the funniest person in the room', 'Be the smartest person in the room'],
  ['Go on a pirate ship adventure', 'Go on a submarine adventure'],
  ['Have fins instead of feet', 'Have a tail like an otter'],
  ['Live where it is always summer', 'Live where it is always winter'],
  ['Teleport anywhere once a day', 'Time travel once in your life'],
  ['Have a personal chef', 'Have a personal stylist'],
  ['Sing everything you say', 'Dance everywhere you go'],
  ['Be a famous video game designer', 'Be a famous musician'],
  ['Read minds', 'See 10 seconds into the future'],
  ['Ride a giant sea turtle', 'Ride a giant eagle'],
  ['Have a room full of plushies', 'Have a room full of video games'],
  ['Sleep in a hammock every night', 'Sleep in a bubble bed every night'],
  ['Win a talent show', 'Win a science fair'],
];

// Forbidden Word: [word to describe, ...words you can't say]
export const FORBIDDEN = [
  ['Otter', 'river', 'swim', 'animal', 'fur'],
  ['Pearl', 'oyster', 'white', 'necklace', 'jewel'],
  ['Pizza', 'cheese', 'slice', 'Italy', 'pepperoni'],
  ['Rainbow', 'colors', 'rain', 'sky', 'arc'],
  ['Lighthouse', 'light', 'ships', 'tower', 'coast'],
  ['Birthday', 'cake', 'party', 'candles', 'age'],
  ['Penguin', 'bird', 'ice', 'tuxedo', 'waddle'],
  ['Pirate', 'ship', 'treasure', 'parrot', 'captain'],
  ['Snowman', 'snow', 'carrot', 'winter', 'build'],
  ['Volcano', 'lava', 'mountain', 'erupt', 'hot'],
  ['Library', 'books', 'read', 'quiet', 'borrow'],
  ['Rocket', 'space', 'launch', 'moon', 'fly'],
  ['Sandcastle', 'beach', 'build', 'bucket', 'sand'],
  ['Dragon', 'fire', 'wings', 'fly', 'scales'],
  ['Homework', 'school', 'teacher', 'study', 'assignment'],
  ['Shark', 'teeth', 'fin', 'ocean', 'fish'],
  ['Pancake', 'breakfast', 'syrup', 'flat', 'flip'],
  ['Guitar', 'strings', 'music', 'play', 'rock'],
  ['Umbrella', 'rain', 'wet', 'open', 'handle'],
  ['Superhero', 'cape', 'powers', 'save', 'villain'],
  ['Telescope', 'stars', 'look', 'space', 'lens'],
  ['Popcorn', 'movie', 'pop', 'butter', 'corn'],
  ['Moon', 'night', 'sky', 'round', 'astronaut'],
  ['Jellyfish', 'sting', 'ocean', 'squishy', 'tentacles'],
  ['Treasure', 'gold', 'chest', 'pirate', 'map'],
  ['Hammock', 'sleep', 'swing', 'tree', 'rope'],
  ['Tornado', 'wind', 'storm', 'spin', 'twister'],
  ['Igloo', 'ice', 'snow', 'house', 'cold'],
];

// Hot Potato Categories: name one, pass it on!
export const CATEGORIES = [
  'Sea creatures', 'Things that are blue', 'Pizza toppings', 'Animals with fur', 'Things at the beach',
  'Video games', 'Fruits', 'Vegetables', 'Ice cream flavors', 'Things you find in a kitchen',
  'Sports', 'Countries', 'Things that are round', 'Musical instruments', 'Things that fly',
  'Breakfast foods', 'Things in a classroom', 'Board games', 'Colors', 'Jobs',
  'Things that are cold', 'Movies', 'Cartoon characters', 'Birds', 'Things you wear',
  'Things with wheels', 'Desserts', 'Things that smell nice', 'Insects', 'Things in space',
  'Superheroes', 'Things that are sticky', 'Pets', 'Things that make noise', 'Things in a toolbox',
];

