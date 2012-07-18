
var exp = require('express');
var app = exp.createServer();

app.mongoose = require('mongoose');
app.root = __dirname;

var config = require('./app/core/config')(app, exp);

var models = {};
models.offers = require(app.root + '/app/models/offer-model')(app.mongoose).model;

require('./app/router')(app, models);

app.listen(process.env.PORT || 8080);
