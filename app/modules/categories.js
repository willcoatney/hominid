

var CAT = {}

CAT.supra = [
    { name: 'eat', icon: 'icon-leaf' }
  , { name: 'drink', icon: 'icon-glass' }
  , { name: 'shop', icon: 'icon-gift' }
  , { name: 'service', icon: 'icon-gift' }
  , { name: 'see', icon: 'icon-eye-open' }
]

CAT.sub_1 = [
    { name : "American" , parsed: "american" , longform: "Food -- American"}
  , { name : "Chinese", parsed: "chinese", longform: "Food -- Chinese"}
  , { name : "Italian" , parsed: "italian", longform: "Food -- Italian"}
  , { name : "Japanese" , parsed: "japanese", longform: "Food -- Japanese"}
  , { name : "Mexican" , parsed: "mexican", longform: "Food -- Mexican"}
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
    { city: "Belton", state:"MO", parsed:"belton" }
  , { city: "Fairway", state:"KS", parsed:"fairway" }
  , { city: "Independence", state:"MO", parsed:"independence" }
  , { city: "Mission", state:"KS", parsed:"mission" }
  , { city: "Kansas City", state:"MO", parsed:"kcmo" }
  , { city: "Kansas City", state:"KS", parsed:"kcks" }
  , { city: "Olathe", state:"KS", parsed:"olathe" }
  , { city: "Overland Park", state:"KS", parsed:"overland_park" }
];

CAT.cities = [
    { city: "Belton", state:"MO", parsed:"", county:"" }
  , { city: "Bonner Springs", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Fairway", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Gardner", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Independence", state:"MO", parsed:"" , county:""}
  , { city: "Kansas City", state:"MO", parsed:"" , county:""}
  , { city: "Kansas City", state:"KS", parsed:"" , county:""}
  , { city: "Lenexa", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Leawood", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Merriam", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Mission", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Olathe", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Overland Park", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Prairie Village", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Roeland Park", state:"KS", parsed:"" , county:"Johnson"}
  , { city: "Shawnee", state:"KS", parsed:"" , county:"Johnson"}
];

module.exports = CAT;
