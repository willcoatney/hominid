
var exp = require('express');
var app = exp.createServer();

app.root = __dirname;
global.host = 'localhost';

require('./app/core/config')(app, exp);
require('./app/router')(app);

var port = process.env.PORT

app.listen(port, function(){
 	console.log("Listening on port %d in %s mode", app.address().port, app.settings.env);
});

// app.listen(8080, function(){
//  	console.log("Listening on port %d in %s mode", app.address().port, app.settings.env);
// });
// 
