const MAP_WIDTH = 975,
  MAP_HEIGHT = 610;

const MIN_STATE_FLOWER_SIZE = 30,
  MAX_STATE_FLOWER_SIZE = 70;

const MIN_IMAGE_SIZE = 30,
  MAX_IMAGE_SIZE = 70;

const INNER_RADIUS_OFFSET = 4,
  OUTER_RADIUS_OFFSET = 16;

const BUFFER = 50;

const MIN_PETAL_COUNT = 3;
const MAX_PETAL_COUNT = 15;

const GREEN_COLOR_SCALE = [
  "#cefad0",
  "#abf7b1",
  "#83f28f",
  "#5ced73",
  "#39e75f",
  "#1fd655",
  "#00c04b",
];
const DARK_GREEN_COLOR = "#008631";

const STATE_ABBREVIATIONS = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

const SPECIES_IMAGES = {
  Mammal: "../images/bear.png",
  Bird: "../images/bird.png",
  Reptile: "../images/reptile.png",
  Amphibian: "../images/frog.png",
  Fish: "../images/fish.png",
  Arachnid: "../images/spider.png",
  Insect: "../images/bee.png",
  Invertebrate: "../images/worm.png",
  Crustacean: "../images/crab.png",
  Mollusk: "../images/snail.png",
};

const OVERLAY_ANIMATION_TIME = 1000;

const OTHER_COLOR = "#ff9896";

const NUMBER_OF_FORESTS_TEXT = "Number of National Parks: ";
const ACRES_OF_FOREST = "Acres Size: ";

const FOREST_LEGEND_WIDTH = 200;
const FOREST_LEGEND_HEIGHT = 30;
