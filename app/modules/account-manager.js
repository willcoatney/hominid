
var mongoose = require('mongoose')

var bcrypt = require('bcrypt')

var moment = require('moment');

var models = {};
models.offers = require('../models/offer-model')(mongoose).model;

var AM = models;

	AM.accounts = models.offers;



module.exports = AM;


// logging in //

AM.autoLogin = function(user, pass, callback)
{
	models.offers.findOne({user:user}, function(e, o) {
		if (o){
			o.pass == pass ? callback(o) : callback(null);
		}	else{
			callback(null);
		}
	});
}

AM.manualLogin = function(user, pass, callback)
{
	AM.accounts.findOne({user:user}, function(e, o) {
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

AM.signup = function(newData, callback) 
{
	AM.accounts.findOne({user:newData.user}, function(e, o) {	
		if (o){
			callback('username-taken');
		}	else{
			AM.accounts.findOne({email:newData.email}, function(e, o) {
				if (o){
					callback('email-taken');
				}	else{
					AM.saltAndHash(newData.pass, function(hash){
						newData.pass = hash;
					// append date stamp when record was created //	
						newData.date = new Date();
            AM.accounts.create(newData, function(e,o){
              callback(null);
            });
					});
				}
			});
		}
	});
}

// update db%

AM.update = function(newData, callback) 
{		
	AM.accounts.findOne({user:newData.user}, function(e, o){
		o.name            = newData.name;
		o.email           = newData.email;
		o.business_name   = newData.business_name;
		o.business_phone  = newData.business_phone;
		o.coupon_title    = newData.coupon_title;
		o.coupon_body     = newData.coupon_body;
		o.coupon_supra = newData.coupon_supra;
		o.coupon_sub = newData.coupon_sub;
		o.coupon_price = newData.coupon_price;
		o.location = newData.location ;
		o.address_street  = newData.address_street;
		o.address_city    = newData.address_city;
		o.address_state   = newData.address_state;
		o.address_zip     = newData.address_zip;
		o.publish = newData.publish;
		o.date_start = moment(newData.date_start || "333").format("YYYY MM DD hh mm");
		o.date_end = moment(newData.date_end || "333").format("YYYY MM DD hh mm");
		o.date = new Date();
		if (newData.pass == ''){
			o.save(); callback(o);
		}	else{
			AM.saltAndHash(newData.pass, function(hash){
				o.pass = hash;
				o.save(); callback(o);			
			});
		}
	});
}

AM.setPassword = function(oldp, newp, callback)
{
	AM.accounts.findOne({pass:oldp}, function(e, o){
		AM.saltAndHash(newp, function(hash){
			o.pass = hash;
			AM.accounts.save(o); callback(o);
		});
	});	
}

AM.validateLink = function(pid, callback)
{
	AM.accounts.findOne({pass:pid}, function(e, o){
		callback(o ? 'ok' : null);
	});
}

AM.saltAndHash = function(pass, callback)
{
	bcrypt.genSalt(10, function(err, salt) {
	    bcrypt.hash(pass, salt, function(err, hash) {
			callback(hash);
	    });
	});
}

AM.delete = function(id, callback) 
{
	AM.accounts.remove({_id: this.getObjectId(id)}, callback);
}

// auxiliary methods //

AM.getEmail = function(email, callback)
{
	AM.accounts.findOne({email:email}, function(e, o){ callback(o); });
}

AM.getObjectId = function(id)
{
// this is necessary for id lookups, just passing the id fails for some reason //	
	return AM.accounts.db.bson_serializer.ObjectID.createFromHexString(id)
}

AM.getPublishedRecords = function(callback) 
{
	AM.accounts.find({'publish':'yes'} && {date: {$lt: new Date()}}).exec(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

AM.getAllRecords = function(callback) 
{
	AM.accounts.find({'publish':'yes'}).exec(
	    function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};

AM.delAllRecords = function(id, callback) 
{
	AM.accounts.remove(); // reset accounts collection for testing //
}

// just for testing - these are not actually being used //

AM.findById = function(id, callback) 
{
	AM.accounts.findOne({_id: this.getObjectId(id)}, 
		function(e, res) {
		if (e) callback(e)
		else callback(null, res)
	});
};


AM.findByMultipleFields = function(a, callback)
{
// this takes an array of name/val pairs to search against {fieldName : 'value'} //
	AM.accounts.find( { $or : a } ).exec(
	    function(e, results) {
		if (e) callback(e)
		else callback(null, results)
	});
}
