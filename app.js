
var exp = require('express');
var app = exp.createServer();

// require('./app/core/utils');

app.everyauth = require('everyauth');
app.mongoose = require('mongoose');

app.root = __dirname;

var config = require('./app/core/config')(app, exp);

// var models = {};
// var models_path = app.root + '/app/models'
// models.offers = require(models_path + '/offer-model')(app.mongoose).model;
// models.users = require(models_path + '/user-model')(app.mongoose).model;

require('./app/router')(app);

/* require('./app/core/error-handler').boot(app); */

app.listen(process.env.PORT || 8080);
