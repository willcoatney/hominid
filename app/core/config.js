
module.exports = function (app, exp) {

  "use strict";


  var stylus = require('stylus');
  var nib    = require('nib');
  /* var mongoose = require('mongoose'); */

  function compile(str, path) {
    return stylus(str)
      .set('filename', path)
      .set('compress', true)
      .use(nib());
  }

	app.configure(function () {
		app.set('views', app.root + '/app/views');
		app.set('view engine', 'jade');
		app.set('view options', { 
        pretty: true 
      , layout: false
    });
		app.use(exp.bodyParser());
		app.use(exp.cookieParser());
		app.use(exp.session({ secret: 'super-duper-secret-secret' }));
		app.use(exp.methodOverride());
		app.use(require('stylus').middleware({
       debug: true
     , src: app.root + '/app'
     , compile: compile
    }));
		app.use(exp.static(app.root + '/app'));
	});

  app.configure('development', function(){
    app.use(exp.errorHandler({ dumbExceptions: true, showStack: true }));
    app.mongoose.connect('mongodb://localhost:27017/login-testing');
    console.log('Connected to DB');
  });

  app.configure('production', function(){
    app.use(exp.errorHandler());
    app.mongoose.connect('mongodb://user:secret@ds033757.mongolab.com:33757/heroku_app5810306');
  })

}
