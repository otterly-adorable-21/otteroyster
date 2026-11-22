// Quiz questions and word lists, shared by the website arcade and the Discord
// games (server/src/bot/content.js re-exports them). Add more lines freely.

// [question, correct answer, ...wrong answers]
export const TRIVIA = [
  ['What do sea otters often use to crack open shellfish?', 'A rock', 'Their tail', 'A stick', 'Their teeth only'],
  ['How do sea otters keep from drifting apart while they sleep?', 'They hold hands', 'They sleep on the beach', 'They hold their breath', 'They tie up with string'],
  ['What is a group of otters floating together called?', 'A raft', 'A pod', 'A herd', 'A flock'],
  ['How do oysters make pearls?', 'Coating an irritant in layers of nacre', 'Swallowing sand', 'Collecting shiny rocks', 'Growing them from seeds'],
  ['Which ocean is the largest?', 'Pacific', 'Atlantic', 'Indian', 'Arctic'],
  ['How many arms does an octopus have?', '8', '6', '10', '12'],
  ['What is the largest animal that has ever lived?', 'Blue whale', 'Megalodon', 'T. rex', 'Whale shark'],
  ['Which of these is NOT a fish?', 'Dolphin', 'Seahorse', 'Eel', 'Tuna'],
  ['What do you call a baby otter?', 'A pup', 'A kit', 'A calf', 'A joey'],
  ['Which sea creature has three hearts?', 'Octopus', 'Shark', 'Jellyfish', 'Crab'],
  ['What gives flamingos their pink color?', 'Their food', 'Sunburn', 'Their blood', 'Pink feathers from birth only'],
  ['Kelp forests are made of what?', 'Large algae (seaweed)', 'Coral', 'Trees', 'Sea grass only'],
  ['What is the saltiest large body of water on Earth?', 'Dead Sea', 'Pacific Ocean', 'Lake Superior', 'Red Sea'],
  ['Which planet is known as the Red Planet?', 'Mars', 'Venus', 'Jupiter', 'Mercury'],
  ['How many sides does a hexagon have?', '6', '5', '7', '8'],
  ['What is frozen water called?', 'Ice', 'Steam', 'Dew', 'Fog'],
  ['Which animal is known for changing its color to blend in?', 'Chameleon', 'Giraffe', 'Penguin', 'Rabbit'],
  ['Where do penguins mostly live?', 'Southern Hemisphere', 'North Pole', 'Deserts', 'Rainforests'],
  ['What is the fastest land animal?', 'Cheetah', 'Lion', 'Horse', 'Greyhound'],
  ['Starfish (sea stars) can regrow lost what?', 'Arms', 'Shells', 'Teeth', 'Eyes only'],
  ['Which gas do plants absorb from the air?', 'Carbon dioxide', 'Oxygen', 'Helium', 'Nitrogen'],
  ['How many continents are there?', '7', '5', '6', '8'],
  ['What do sea otters have more of than almost any other animal?', 'Fur hairs per inch', 'Teeth', 'Legs', 'Whiskers'],
  ['A crab walks mostly in which direction?', 'Sideways', 'Backwards', 'Forwards', 'In circles'],
  ['What is the hardest natural substance?', 'Diamond', 'Gold', 'Iron', 'Pearl'],
  ['Which tide happens when the water is highest?', 'High tide', 'Neap tide', 'Low tide', 'Rip tide'],
  ['Which bird is famous for diving into water to catch fish?', 'Pelican', 'Ostrich', 'Owl', 'Parrot'],
  ['How long does it take Earth to orbit the Sun?', 'About a year', 'A month', 'A day', '10 years'],
  ['What is a male sea horse known for?', 'Carrying the babies', 'Being the biggest fish', 'Living on land', 'Having no fins'],
  ['Which of these animals is a mammal?', 'Walrus', 'Shark', 'Lobster', 'Squid'],
  ['What color is a polar bear\'s skin?', 'Black', 'White', 'Pink', 'Brown'],
  ['Which instrument has 88 keys?', 'Piano', 'Guitar', 'Violin', 'Flute'],
  ['What is the main ingredient in guacamole?', 'Avocado', 'Cucumber', 'Pea', 'Lime'],
  ['Which shape has three sides?', 'Triangle', 'Square', 'Circle', 'Pentagon'],
  ['A lighthouse is used to help who?', 'Ships', 'Planes', 'Trains', 'Cars'],
  ['What are baby frogs called?', 'Tadpoles', 'Cubs', 'Chicks', 'Puppies'],
  ['Which sense do sea otters rely on with their sensitive whiskers?', 'Touch', 'Taste', 'Smell', 'Sight'],
  ['What do bees make?', 'Honey', 'Milk', 'Silk', 'Wax only'],
  ['Which is the coldest continent?', 'Antarctica', 'Europe', 'Asia', 'Australia'],
  ['What do you call molten rock above ground?', 'Lava', 'Magma', 'Basalt', 'Ash'],
];

export const HANGMAN_WORDS = [
  'OTTER', 'OYSTER', 'PEARL', 'SEASHELL', 'LIGHTHOUSE', 'SANDCASTLE', 'SEAWEED', 'DOLPHIN', 'JELLYFISH', 'STARFISH',
  'TREASURE', 'SHIPWRECK', 'ANCHOR', 'LAGOON', 'CORAL', 'PENGUIN', 'WALRUS', 'NARWHAL', 'SUBMARINE', 'SNORKEL',
  'SURFBOARD', 'TIDEPOOL', 'BARNACLE', 'SEAHORSE', 'PUFFIN', 'ISLAND', 'COMPASS', 'BLANKET', 'PICNIC', 'RAINBOW',
];

export const SCRAMBLE_WORDS = [
  'OTTER', 'PEARL', 'SHELL', 'WAVES', 'BEACH', 'CORAL', 'SHARK', 'WHALE', 'CLAMS', 'SQUID', 'OCEAN', 'TIDES',
  'SANDY', 'STORM', 'BOATS', 'CRABS', 'KELPY', 'FLOAT', 'SWIMS', 'SPLASH', 'BUBBLE', 'FISHES', 'ANCHOR', 'PIRATE',
  'PADDLE', 'SAILOR', 'ISLAND', 'LAGOON', 'OYSTER', 'TURTLE',
];

// [emoji clue, answer, ...wrong options]
export const EMOJI = [
  ['🦦🪨🐚', 'Otter cracking a shell', 'Rock band', 'Beach day', 'Seal nap'],
  ['⭐🐟', 'Starfish', 'Swordfish', 'Sunfish', 'Goldfish'],
  ['🌧️🌈', 'Rainbow', 'Thunderstorm', 'Snow day', 'Sunset'],
  ['🍯🐻', 'Honey bear', 'Teddy bear', 'Polar bear', 'Bee hive'],
  ['🕷️🕸️', 'Spiderweb', 'Fishing net', 'Haunted house', 'Bug spray'],
  ['🌙🚶', 'Moonwalk', 'Night shift', 'Sleepwalk', 'Star gazing'],
  ['🔥🚒', 'Fire truck', 'Campfire', 'Volcano', 'Hot sauce'],
  ['🐝🦵', "Bee's knees", 'Bee sting', 'Honeycomb', 'Butterfly'],
  ['🍕🎉', 'Pizza party', 'Birthday cake', 'Fast food', 'Picnic'],
  ['⏰🦵', 'Clockwork', 'Alarm', 'Hourglass', 'Running late'],
  ['🌊🏄', 'Surfing', 'Sailing', 'Swimming', 'Diving'],
  ['🎂🕯️🎈', 'Birthday', 'Wedding', 'Graduation', 'Holiday'],
  ['☀️🌻', 'Sunflower', 'Daisy', 'Sunrise', 'Summer'],
  ['🐉🐲🏰', 'Dragon castle', 'Zoo', 'Pet shop', 'Dinosaur park'],
  ['🧊🏔️🐧', 'Antarctica', 'Desert', 'Jungle', 'Volcano'],
  ['🍎📱', 'Apple phone', 'Fruit salad', 'Pie', 'Tablet'],
  ['🐟🍟', 'Fish and chips', 'Sushi', 'Tacos', 'Burger'],
  ['🌟🐠', 'Star fish (or a shiny fish!)', 'Night fishing', 'Goldfish bowl', 'Coral'],
  ['📚🐛', 'Bookworm', 'Butterfly', 'Library', 'Caterpillar'],
  ['🌧️🐱🐶', "Raining cats and dogs", 'Pet store', 'Wet day', 'Dog park'],
  ['🥶🦶', 'Cold feet', 'Ice skating', 'Snowman', 'Frozen'],
  ['🍰🚶', 'Cakewalk', 'Bakery', 'Dessert', 'Birthday'],
];

export const FISH = [
  { name: 'Old Boot', icon: '🥾', pts: 0, weight: 10 },
  { name: 'Sardine', icon: '🐟', pts: 3, weight: 34 },
  { name: 'Clownfish', icon: '🐠', pts: 5, weight: 24 },
  { name: 'Pufferfish', icon: '🐡', pts: 7, weight: 15 },
  { name: 'Squid', icon: '🦑', pts: 10, weight: 9 },
  { name: 'Octopus', icon: '🐙', pts: 12, weight: 6 },
  { name: 'Golden Pearl Oyster', icon: '🦪', pts: 25, weight: 2 },
];
