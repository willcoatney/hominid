
var mongoose = require('mongoose')
var request = require('request')
var bcrypt = require('bcrypt')
var moment = require('moment');

var GridStore = mongoose.mongo.GridStore
var Grid = mongoose.mongo.Grid
var ObjectId = mongoose.mongo.BSONPure.ObjectId


var ImageSchema = new mongoose.Schema({
  name: String,
  files:[ mongoose.Schema.Mixed ]
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
  address_street: String,
  address_city: String,
  address_state: String,
  address_zip: String,
  county: String,
  location: [],
  cat: String,
  tags: [],
  date: String,
  date_numeric: Number,
  publish: String
});



ImageSchema.methods.addFile = function(file, options, fn) {
  var _this = this;
  return Image.putFile(file.path, file.filename, options, function(err, result) {
    _this.files.push(result);
    return _this.save(fn);
  });
};



var Offer = mongoose.model('offers', OfferSchema);
var Image = mongoose.model('offers', ImageSchema);



module.exports = Offer;
module.exports = Image;


var parse,
  __slice = [].slice;

Image.putFile = function() {
  var db, fn, name, options, path, _i;
  path = arguments[0], name = arguments[1], options = 4 <= arguments.length ? __slice.call(arguments, 2, _i = arguments.length - 1) : (_i = 2, []), fn = arguments[_i++];
  db = mongoose.connection.db;
  options = parse(options);
  options.metadata.filename = name;
  return new GridStore(db, name, "w", options).open(function(err, file) {
    if (err) {
      return fn(err);
    }
    return file.writeFile(path, fn);
  });
};

parse = function(options) {
  var opts;
  opts = {};
  if (options.length > 0) {
    opts = options[0];
  }
  if (!opts.metadata) {
    opts.metadata = {};
  }
  return opts;
};

Image.get = function(id, fn) {
  var db, store;
  db = mongoose.connection.db;
  id = new ObjectID(id);
  store = new GridStore(db, id, "r", {
    root: "fs"
  });
  return store.open(function(err, store) {
    if (err) {
      return fn(err);
    }
    if (("" + store.filename) === ("" + store.fileId) && store.metadata && store.metadata.filename) {
      store.filename = store.metadata.filename;
    }
    return fn(null, store);
  });
};



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

Offer.update = function( q , callback) 
{		
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
		o.address_street  = q.address_street;
		o.address_city    = q.address_city;
		o.address_state   = q.address_state;
		o.address_zip     = q.address_zip;
		o.county    = q.county;
		o.location = q.location;
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
