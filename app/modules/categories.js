

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

CAT.counties = [
    { county:"Johnson" , state: "KS", cities:[
       { city: "De Soto" }
     , { city: "Edgerton" }
     , { city: "Fairway" }
     , { city: "Gardner" }
     , { city: "Lake Quivira" }
     , { city: "Lenexa" }
     , { city: "Leawood" }
     , { city: "Merriam" }
     , { city: "Mission" }
     , { city: "Mission Hills" }
     , { city: "Mission Woods" }
     , { city: "Olathe" }
     , { city: "Overland Park" }
     , { city: "Prairie Village" }
     , { city: "Roeland Park" }
     , { city: "Shawnee" }
     , { city: "Spring Hill" }
     , { city: "Westwood Hills" }
    ]}
  , { county:"Clay" , state: "MO", cities: [
       { city: "Avondale" }
     , { city: "Birmingham" }
     , { city: "Claycomo" }
     , { city: "Ectonville" }
     , { city: "Excelsior Estates" }
     , { city: "Excelsior Springs" }
     , { city: "Gladstone" }
     , { city: "Glenaire" }
     , { city: "Holt" }
     , { city: "Kansas City" }
     , { city: "Kearney" }
     , { city: "Lawson" }
     , { city: "Liberty" }
     , { city: "Missouri City" }
     , { city: "Mosby" }
     , { city: "North Kansas City" }
     , { city: "Oaks" }
     , { city: "Oakview" }
     , { city: "Oakwood" }
     , { city: "Oakwood Park" }
     , { city: "Pleasant Valley" }
     , { city: "Prathersville" }
     , { city: "Randolph" }
     , { city: "Smithville" }
     , { city: "Sugar Creek" }
    ]}
  , { county:"Jackson" , state: "MO", cities: [
       { city: "Blue Springs" }
     , { city: "Blue Summit" }
     , { city: "Buckner" }
     , { city: "Grain Valley" }
     , { city: "Grandview" }
     , { city: "Greenwood" }
     , { city: "Independence" }
     , { city: "Kansas City" }
     , { city: "Lake Lotowana" }
     , { city: "Lake Tapawingo" }
     , { city: "Lee's Summit" }
     , { city: "Levasy" }
     , { city: "Lone Jack" }
     , { city: "Oak Grove" }
     , { city: "Raytown" }
     , { city: "Riverbend" }
     , { city: "Sibley" }
     , { city: "Sugar Creek" }
     , { city: "Unity Village" }
    ]}
  , { county:"Platte" , state: "MO", cities: [
       { city: "Camden Point" }
     , { city: "Dearborn" }
     , { city: "Edgerton" }
     , { city: "Farley" }
     , { city: "Ferrelview" }
     , { city: "Houson Lake" }
     , { city: "Kansas City" }
     , { city: "Lake Waukomis" }
     , { city: "Northmoor" }
     , { city: "Parkville" }
     , { city: "Platte City" }
     , { city: "Platte Woods" }
     , { city: "Ridgely" }
     , { city: "Riverside" }
     , { city: "Tracy" }
     , { city: "Waldron" }
     , { city: "Weatherby Lake" }
     , { city: "Weston" }
    ]}
  , { county:"Wyandotte" , state: "MO", cities: [
       { city: "Bonner Springs" }
     , { city: "Edwardsville" }
     , { city: "Kansas City" }
    ]}
];

CAT.cities = [
    { city: "Belton", state:"MO", parsed:"", county:"" }
  , { city: "Independence", state:"MO", parsed:"" , county:""}
  , { city: "Kansas City", state:"MO", parsed:"" , county:""}
  , { city: "Kansas City", state:"KS", parsed:"" , county:""}
];

module.exports = CAT;
