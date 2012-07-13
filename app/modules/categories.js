

var CAT = {}

CAT.supra = [
    { name: 'eat', icon: 'icon-leaf' }
  , { name: 'drink', icon: 'icon-glass' }
  , { name: 'own', icon: 'icon-gift' }
  , { name: 'see', icon: 'icon-eye-open' }
]

CAT.sub_1 = [
    { name : "American" , parsed: "american" , longform: "Food -- American"}
  , { name : "Chinese", parsed: "chinese", longform: "Food -- Chinese"}
  , { name : "Italian" , parsed: "italian", longform: "Food -- Italian"}
  , { name : "Japanese" , parsed: "japanese", longform: "Food -- Japanese"}
  , { name : "Mexican" , parsed: "mexican", longform: "Food -- Mexian"}
  , { name : "Other" , parsed: "eat_other", longform: "Food -- Other"}
];

CAT.sub_2 = [
    { name : "Beer", parsed: "beer", longform: "Alcohol -- Beer"}
  , { name : "Wine", parsed: "wine", longform: "Alcohol -- Wine"}
  , { name : "Liquor", parsed: "liquor", longform: "Alcohol -- Liquor"}
  , { name : "Cocktail", parsed: "cocktail", longform: "Alcohol -- Cocktail"}
  , { name : "Other", parsed: "drink_other", longform: "Alcohol -- Other"}
];

CAT.sub_3 = [
    { name : "Clothing", parsed: "clothing", longform: "Possession -- Clothing"}
  , { name : "Electronics", parsed: "electronics", longform: "Possession -- Electronics"}
  , { name : "Supplies", parsed: "supplies", longform: "Possession -- Supplies"}
  , { name : "Tools", parsed: "tools", longform: "Possession -- Tools"}
  , { name : "Toys", parsed: "toys", longform: "Possession -- Toys"}
  , { name : "Other", parsed: "own_other", longform: "Possession -- Other"}
];

CAT.sub_4 = [
    { name : "Art", parsed: "art", longform: "Event -- Art Showing"}
  , { name : "Exhibit", parsed: "exhibit", longform: "Event -- Exhibit"}
  , { name : "Game", parsed: "game", longform: "Event -- Sports Game"}
  , { name : "Music", parsed: "music", longform: "Event -- Concert or Music"}
  , { name : "Theater", parsed: "theater", longform: "Event -- Theater"}
  , { name : "Other", parsed: "see_other", longform: "Event -- Other"}
];

CAT.locations = [
    { city: "Independence", state:"MO", parsed:"independence" }
  , { city: "Belton", state:"MO", parsed:"belton" }
  , { city: "Fairway", state:"KS", parsed:"fairway" }
  , { city: "Mission", state:"KS", parsed:"mission" }
  , { city: "Kansas City", state:"MO", parsed:"kcmo" }
  , { city: "Kansas City", state:"KS", parsed:"kcks" }
  , { city: "Olathe", state:"KS", parsed:"olathe" }
  , { city: "Overland Park", state:"KS", parsed:"overland_park" }
];

module.exports = CAT;
