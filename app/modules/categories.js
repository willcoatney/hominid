

var CT = {}


CT.cats = [
  {
  name: "Food",
  verb: "eat",
    tags: [
     "Healthy"
    ,"Filling"
    ,"Savory"
    ,"Sweet"
    ]}
 ,{
   name: "Drink",
   verb: "drink",
   tags: [
      "Hard"
    , "Imported"
    , "Mixed"
    ]}
 ,{
   name: "Product",
   verb: "buy",
   tags: [
      "Cool"
    , "Fun"
    , "Pretty"
    , "Useful"
    ]}
 ,{
   name: "Service",
   verb: "hire",
   tags: [
      "Mechanical"
    , "Personal"
    , "Professional"
    , "Technical"
    ]}
 ,{ 
   name: "Event", 
   verb: "go to", 
   tags: [
      "Exciting"
    , "Funny"
    , "Inspiring"
    , "Relaxing"
    ]}
];

CT.wildcards = [
   { wildcard: "Fun" }
  ,{ wildcard: "Free" }
  ,{ wildcard: "Social" }
];


CT.counties = [
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

module.exports = CT;
