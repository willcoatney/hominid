
var mongoose = require('mongoose')
var request = require('request')
var bcrypt = require('bcrypt')
var moment = require('moment');

var LocationSchema = new mongoose.Schema({
  number: Number,
  street: String,
  city: String,
  state: String,
  zip: String,
  county: String
});

var OfferSchema = new mongoose.Schema({
  cust: String,
  user: { type:String , unique:true, sparse:true },
  email: String,
  pass: String,

  business_name: String,
  business_phone: String,

  coupon_title: String,
  coupon_body: String,
  coupon_supra: String,
  coupon_sub: String,
  coupon_price: String,


  loc_quantity: String,
  loc: [ LocationSchema ],

  location: [],
  logo: String,
  color: String,
  cat: String,
  tags: [],
  date: String,
  date_numeric: Number,
  publish: String
});


var Offer = mongoose.model('offers', OfferSchema);


module.exports = Offer;

// logging in //

Offer.autoLogin = function(user, pass, callback)
{
	Offer.findOne({user:user}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

Offer.manualLogin = function(user, pass, callback)
{
	Offer.findOne({user:user}, function(e, o) {
		if (o == null){
			callback('user-not-found');
		}	else{
			bcrypt.compare(pass, o.pass, function(err, res) {
				if (res){
					callback(null, o);
				}	else{
					callback('invalid-password');				
				}
			});
		}
	});
}

// record insertion, update & deletion methods //


Offer.signup = function(newData, callback){
  Offer.findOne({user:newData.user}, function(e, o) {	
    if (o){
      callback('username-taken');
    }	else{
      Offer.findOne({email:newData.email}, function(e, o) {
        if (o){
          callback('email-taken');
        }	else{
          Offer.saltAndHash(newData.pass, function(hash){
            newData.pass = hash;
          // append date stamp when record was created //	
            newData.date = new Date();
            Offer.create(newData, function(e,o){
              callback(null);
              });
            });
          }
        });
      }
    });
  }

// update db%

Offer.update = function( q , callback){		
	Offer.findOne({user: q.user}, function(e, o){
		o.name            = q.name;
		o.email           = q.email;
		o.business_name   = q.business_name;
		o.business_phone  = q.business_phone;
		o.coupon_title    = q.coupon_title;
		o.coupon_body     = q.coupon_body;
		o.coupon_supra = q.coupon_supra;
		o.coupon_sub = q.coupon_sub;
		o.coupon_price = q.coupon_price;

    var x = q.loc_quantity;
    
    o.loc_quantity = x;

    for ( var i=0; i<6; i++){
      o.loc.pop()
    }
    for ( var i=0; i<x; i++){
      o.loc.addToSet({ 
        number : i + 1,
        street : q.street,
        city   : q.city,
        state  : q.state,
        zip    : q.zip,
        county : q.county
      });
    }

		o.location = q.location;
		o.logo = q.logo;
		o.color = q.color;
		o.cat = q.cat;
		o.tags = q.tags;
		o.publish = q.publish;
		o.date = moment();
		o.date_numeric = moment().format('YYYYMMDDHHmmss');

		if ( q.pass == ''){
			o.save(); callback(o);
		}	else{
			Offer.saltAndHash( q.pass, function(hash){
				o.pass = hash;
				o.save(); callback(o);			
			});
		}
	});
}

Offer.setPassword = function(oldp, newp, callback)
{
	Offer.findOne({pass:oldp}, function(e, o){
		Offer.saltAndHash(newp, function(hash){
			o.pass = hash;
			Offer.save(o); callback(o);
		});
	});	
}

Offer.validateLink = function(pid, callback)
{
	Offer.findOne({pass:pid}, function(e, o){
		callback(o ? 'ok' : null);
	});
}

Offer.saltAndHash = function(pass, callback)
{
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(pass, salt, function(err, hash) {
			callback(hash);
	    });
	});
}

Offer.delete = function(id, callback) 
{
	Offer.remove({_id: this.getObjectId(id)}, callback);
}

// auxiliary methods //

Offer.getEmail = function(email, callback)
{
	Offer.findOne({email:email}, function(e, o){ callback(o); });
}

Offer.getObjectId = function(id)
{
// this is necessary for id lookups, just passing the id fails for some reason //	
	return Offer.db.bson_serializer.ObjectID.createFromHexString(id)
}

Offer.getPublishedRecords = function(callback) 
{
	Offer.find({'publish':'yes'} && {date: {$lt: new Date()}}).exec(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

Offer.getAllRecords = function(callback) 
{
	Offer.find({'publish':'true'}).exec(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

Offer.delAllRecords = function(id, callback) 
{
	Offer.remove(); // reset accounts collection for testing //
}

// just for testing - these are not actually being used //

Offer.findById = function(id, callback) 
{
	Offer.findOne({_id: this.getObjectId(id)}, 
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


Offer.findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	Offer.find( { $or : a } ).exec(
	    function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}
