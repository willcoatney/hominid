module.exports = function(mongoose){
  var collection = 'users';
  var Schema = mongoose.Schema;
  var ObjectId = Schema.ObjectId;

  var schema = new Schema({
    _id: ObjectId,
    _created: Date,
    name: String,
    email: String,
    pass: String
  })

  this.model = mongoose.model(collection, schema);

  return this;

};
