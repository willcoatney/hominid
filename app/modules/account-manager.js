
var mongoose = require('mongoose')
var bcrypt = require('bcrypt')
var moment = require('moment');


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
  address_street: String,
  address_city: String,
  address_state: String,
  address_zip: String,
  county: String,
  location: [],
  cat: String,
  tags: [],
  date_start: String,
  date_end: String,
  date: String,
  publish: String
});

// OfferSchema.path('publish').validate(function (v) {
//   return v.length > 5;
// }, 'Publish cannot be blank');



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


Offer.signup = function(newData, callback) 
{
  Offer.findOne({user:newData.user}, function(e, o) {	
    if (o){
      callback('username-taken');
    }	else{
      Offer.findOne({email:newData.email}, function(e, o) {
        if (o){
          callback('email-taken');
        }	else{
          Offer.findOne({cust:newData.cust}, function(e, o) {	
            if (o){
              callback('customer-taken');
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
  });
}

// update db%

Offer.update = function(newData, callback) 
{		
	Offer.findOne({user:newData.user}, function(e, o){
		o.name            = newData.name;
		o.email           = newData.email;
		o.business_name   = newData.business_name;
		o.business_phone  = newData.business_phone;
		o.coupon_title    = newData.coupon_title;
		o.coupon_body     = newData.coupon_body;
		o.coupon_supra = newData.coupon_supra;
		o.coupon_sub = newData.coupon_sub;
		o.coupon_price = newData.coupon_price;
		o.address_street  = newData.address_street;
		o.address_city    = newData.address_city;
		o.address_state   = newData.address_state;
		o.address_zip     = newData.address_zip;
		o.county    = newData.county;
		o.location = newData.location;
		o.cat = newData.cat;
		o.tags = newData.tags;
		o.publish = newData.publish;
		o.date_start = moment(newData.date_start || "333").format("YYYY MM DD hh mm");
		o.date_end = moment(newData.date_end || "333").format("YYYY MM DD hh mm");
		o.date = new Date();
		if (newData.pass == ''){
			o.save(); callback(o);
		}	else{
			Offer.saltAndHash(newData.pass, function(hash){
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
