document.addEventListener("DOMContentLoaded", () => {
const wordDisplay = document.getElementById("wordDisplay");
const newWordBtn = document.getElementById("newWordBtn");
const difficultyButtons = document.querySelectorAll(".difficulty");

let currentDifficulty = "easy";

const words = {
  easy: [
    "bark", "stairs", "feet", "turtle", 
    "swing", "pie", "roly poly", "coin", "rocket", 
    "ice cream cone", "zoo", "basketball", 
    "bench", "crayon", "neck", "ring", "jar", "fish", 
    "starfish", "leg", "grass", "candle", "bell", "worm", "ball", 
    "motorcycle", "woman", "bat", "bee", "beak", 
    "doll", "rabbit", "Earth", "button", "cloud", 	
    "octopus", "kite", "triangle", "ghost", "ant", "arm", "helicopter", 
    "bike", "jail", "house", "love", "grapes", "truck", "boat", "baseball", 
    "bumblebee", "square", "snowflake", "jar", "bathroom", "cube", 
    "nail", "blocks", "hair", "crab", "slide", "lollipop", "girl", 
    "dinosaur", "apple", "hat", "eye", "zigzag", "snail", "shoe", "lion", 
    "ladybug", "car", "line", "moon", "face", "candy", "lizard", "circle", 
    "water", "horse", "monkey", "giraffe", "lemon", "frog", "alligator", "island"
  ],
  medium: [
    "cork", "monster", "watch", "fan", "match", "zebra", "pinecone", "elbow",
    "tissue", "apologize", "calendar", "donkey", "cotton candy", "step", "money",
    "iron", "jungle", "unicorn", "brick", "bottle", "class", "dollar", "magic carpet",
    "flute", "roof", "seashell", "cucumber", "yarn", "smile", "insect", "slope", "goldfish",
    "scarecrow", "quarter", "button", "mitten", "thumb", "sign", "cannon", "jacket", "detective",
    "fax", "germ", "alarm clock", "twig", "scar", "corn dog", "grandma", "plank", "seaweed", "wooly mammoth",
    "toy", "razor", "list", "paperclip", "bathroom scale", "farm", "notepad", "north", "soap", "bike",
    "safety goggles", "banana split", "half", "trophy", "sleeve", "positive", "windmill", "run",
    "sunburn", "lemon", "campfire", "pollution", "pet", "seed", "spring", "ask", "cardboard", "lunchbox",
    "trip", "hot dog", "chip", "motorcycle", "skirt", "bus", "fungus", "pantry", "lipstick",
    "top hat", "wagon", "ironing board", "lock", "children", "DVD", "ice", "coconut", "tulip", "picture frame",
    "corn"
  ],
  hard: [
    "tag", "eighteen-wheeler", "drive-through", "mysterious", "print", "wedding cake", "drugstore", "scream",
    "partner", "roller coaster", "skating rink", "devious", "baseboards", "dead end", "cloak", "gumball",
    "houseboat", "laser", "centimeter", "interception", "signal", "yardstick", "stew", "jaw",
    "boa constrictor", "vehicle", "sap", "monsoon", "gown", "reveal", "drought", "crane", "bookend", "miner",
    "robe", "toy store", "point", "obey", "darts", "receipt", "character", "softball", "snag", "Jedi", "boulevard",
    "parade", "laundry detergent", "ornament", "thrift store", "snooze", "athlete", "cruise", "rind",
    "shampoo", "RV", "nanny", "lunar rover", "glitter", "story", "barbershop", "trapped", "dress shirt", "puppet", "trail",
    "crate", "turtleneck", "honk", "earthquake", "cape", "videogame", "right", "synchronized swimming", "shelter", "half",
    "caviar", "chime", "dodgeball", "lap", "clique", "ashamed", "tiptoe", "crust", "zipper", "jeans", "mime", "first class",
    "bleach", "trip", "thief", "lung", "customer", "baggage", "end zone", "chestnut", "hydrogen", "koala", "stage", "quicksand"
  ]
};

difficultyButtons.forEach(button => {
  button.addEventListener("click", () => {

    difficultyButtons.forEach(btn => btn.classList.remove("active"));

    button.classList.add("active");
    currentDifficulty = button.dataset.level;
  });
});

newWordBtn.addEventListener("click", () => {
  const wordList = words[currentDifficulty];
  const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
  wordDisplay.textContent = randomWord;
    });
});
