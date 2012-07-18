
module.exports = function (app, exp, mongoose) {

  "use strict";

  var config = this;

  var stylus = require('stylus');
  var nib    = require('nib');

  function compile(str, path) {
    return stylus(str)
      .set('filename', path)
      .set('compress', true)
      .use(nib());
  }

	app.configure(function () {
		app.set('views', app.root + '/app/views');
		app.set('view engine', 'jade');
		app.set('view options', {pretty: true, layout: false});
		app.use(exp.bodyParser());
		app.use(exp.cookieParser());
		app.use(exp.session({ secret: 'bumblebeetuna' }));
		app.use(exp.methodOverride());
		app.use(require('stylus').middleware({debug: true, src: app.root + '/app', compile: compile }));
		app.use(exp.static(app.root + '/app'));
	});

  app.configure('development', function(){
    app.use(exp.errorHandler({ dumbExceptions: true, showStack: true }));
    var uri = 'mongodb://localhost:27017/login-testing';
    app.mongoose.connect(uri);
    console.log('Connected to %s', uri);
  });

  app.configure('production', function(){
    app.use(exp.errorHandler());
    app.mongoose.connect('mongodb://user:secret@ds033757.mongolab.com:33757/heroku_app5810306');
  });

  return config;

}
