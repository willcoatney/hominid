module.exports = function (app, exp) {

  "use strict";

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
	
}
