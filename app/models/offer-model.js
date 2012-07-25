
module.exports = function(mongoose){
  var collection = 'offers';
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var schema = new Schema({
    author: ObjectId,
    cust: String,
    user: { type:String , index:true },
    email: String,
    pass: String,
    business_name: String,
    business_phone: String,
    coupon_title: String,
    coupon_body: String,
    coupon_supra: String,
    coupon_sub: String,
    coupon_price: String,
    location: String,
    address_street: String,
    address_city: String,
    address_state: String,
    address_zip: String,
    address: {
      street: String,
      city: String,
      state: String,
      zip: Number,
    },
    date_start: String,
    date_end: String,
    date: String,
    publish: String
  });

  this.model = mongoose.model(collection, schema);


  return this;
};
