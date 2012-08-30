

var Offer  = require('./modules/account-manager');
var EM  = require('./modules/email-dispatcher');
var CT = require('./modules/categories');
var IM = require('./modules/image-manager');

module.exports = function (app) {

  "use strict";

// main login page //



  app.get('/', function (req, res) {
    console.log('login', req.cookies.user, req.cookies.pass);
    if (req.cookies.user == undefined || req.cookies.pass == undefined ) {
      Offer.getAllRecords( function(e, docs){
        res.render('print', {
          locals: {
              CT : CT
            , offers : docs
            , user : req.cookies.user
          }
        });
      });
      console.log('Unidentified user has landed on "/"');
    } else {
      Offer.getAllRecords( function(e, docs){
        res.render('print', { 
          locals: {
              CT : CT
            , offers : docs
            , user       : req.cookies.user
            , udata      : req.session.user
          }
        });
      });
      console.log('User ' + req.cookies.user + ' landed on "/"');
    }
  });

  app.get('/upvote/:id', function( req, res, cb ){
    Offer.upvote({
      user: req.params.id
    })
  })


  app.post('/', function (req, res) {
    if (req.param('email') != null) {
      Offer.getEmail(req.param('email'), function(o){
        if (o){
          res.send('ok', 200);
          EM.send(o, function (e,m) { console.log('error : ' + e, 'msg : ' +m)});
        } else {
            res.send('email-not-found', 400);
        }
      });
    } else {
      Offer.manualLogin(req.param('user'), req.param('pass'), function (e,o) {
        if (!o) {
          res.send(e, 400);
        } else {
            req.session.user = o;
          if (req.param('remember-me') == 'true'){
            res.cookie('user', o.user, { maxAge: 900000 });
            res.cookie('pass', o.pass, { maxAge: 900000 });
          }
          res.send(o, 200);
        }
      });
    }
  });

// login //
	app.get('/login', function (req, res) {
    // check if the user's credentials are saved in a cookie //
      if (req.cookies.user == undefined || req.cookies.pass == undefined) {
        res.render('login', {
          locals: {
            user: req.cookies.user
          }
        });
        console.log('Unidentified user has landed on "/login"');
      } else {
    // attempt automatic login //
        Offer.autoLogin(req.cookies.user, req.cookies.pass, function (o) {
          if (o !== null) {
              req.session.user = o;
            res.redirect('/home');
            console.log('User ' + req.cookies.user + ' redirected to "/home"');
          } else {
            res.render('login', {
              locals: {
                  CT: CT
                , user: req.cookies.user
              }
            });
          }
      })
    }
	});
	
	app.post('/login', function (req, res) {
		if (req.param('email') != null) {
			Offer.getEmail(req.param('email'), function(o){
				if (o){
					res.send('ok', 200);
					EM.send(o, function(e, m){ console.log('error : '+e, 'msg : '+m)});	
				}	else{
					res.send('email-not-found', 400);
				}
			});
		} else {
		// attempt manual login //
			Offer.manualLogin(req.param('user'), req.param('pass'), function(e, o){
				if (!o){
					res.send(e, 400);
				}	else{
				    req.session.user = o;
					if (req.param('remember-me') == 'true'){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });
					}
					res.send(o, 200);
				}
			});
		}
	});
	
// logged-in user homepage //
	
	app.get('/home', function (req, res, docs) {
	    if (req.session.user == null){
	// if user is not logged-in redirect back to login page //
	        res.redirect('/login');
	    } else {
			res.render('home', {
				locals: {
            CT: CT
          , IM: IM
          , offers: docs
          , user: req.cookies.user
					, udata : req.session.user
          }
        });
	    }
	});

	
	app.post('/home', function (req, res) {
    if (req.param('user') != undefined) {
			Offer.update({
				user            : req.param('user'),
				email           : req.param('email'),
				pass            : req.param('pass'),
				business_name   : req.param('business_name'),
				business_phone  : req.param('business_phone'),
				coupon_title    : req.param('coupon_title'),
				coupon_body     : req.param('coupon_body'),
				coupon_price: req.param('coupon_price'),

				street_1 : req.param('street_1'),
				city_1   : req.param('city_1'),
				state_1  : req.param('state_1'),
				zip_1    : req.param('zip_1'),
				county_1 : req.param('county_1'),
				street_2 : req.param('street_2'),
				city_2   : req.param('city_2'),
				state_2  : req.param('state_2'),
				zip_2    : req.param('zip_2'),
				county_2 : req.param('county_2'),
				street_3 : req.param('street_3'),
				city_3   : req.param('city_3'),
				state_3  : req.param('state_3'),
				zip_3    : req.param('zip_3'),
				county_3 : req.param('county_3'),

        loc_quantity: req.param('loc_quantity'),

				logo: req.param('logo'),
				color: req.param('color'),
				cat: req.param('cat'),
				tags: req.param('tags'),
				date_start: req.param('date_start'),
				date_end: req.param('date_end'),
				publish: req.param('publish')
			}, function (o) {
				if (o) {
					req.session.user = o;
			// update the user's login cookies if they exists //
					if (req.cookies.user != undefined && req.cookies.pass != undefined){
						res.cookie('user', o.user, { maxAge: 900000 });
						res.cookie('pass', o.pass, { maxAge: 900000 });	
					}
					res.send('ok', 200);
				}	else{
					res.send('error-updating-account', 400);
				}
			});
      Offer.upvote({
        user: req.param('user')
      })
		}	else if (req.param('logout') == 'true'){
			res.clearCookie('user');
			res.clearCookie('pass');
			req.session.destroy(function(e){ res.send('ok', 200); });
		}
	});	
  
	
// creating new accounts //	
	
	app.get('/signup', function(req, res) {
		res.render('signup', { 
			locals: {
        user: req.cookies.user
      }
		});
	});
	
	app.post('/signup', function(req, res){
		Offer.signup({
			user : req.param('user'),
			email : req.param('email'),
			pass : req.param('pass'),
			cust : req.param('cust')
		}, function(e, o){
			if (e){
				res.send(e, 400);
			}	else{
				res.send('ok', 200);
			}
		});
	});

// password reset //

	app.get('/reset-password', function(req, res) {
		Offer.validateLink(req.query["u"], function(e){
			if (e != 'ok'){
				res.redirect('/');
			} else{
				res.render('reset', {
					locals: {
						title : 'Reset Password', 
            pid : req.query["u"]
					}
				});
			}
		})
	});
	
	app.post('/reset-password', function(req, res) {
		Offer.setPassword(req.param('pid'), req.param('pass'), function(o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});	
	
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		Offer.getAllRecords( function(e, docs){
			res.render('print', {
        locals: {
            title : 'Account List'
          , accts :  docs
        } 
      });
		})
	});	
	
	app.post('/delete', function(req, res){
		Offer.remove({ _id: req.body.id }, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
        req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});

	// app.post('/delete', function(req, res){
	// 	Offer.delete(req.body.id, function(e, obj){
	// 		if (!e){
	// 			res.clearCookie('user');
	// 			res.clearCookie('pass');
	//             req.session.destroy(function(e){ res.send('ok', 200); });
	// 		}	else{
	// 			res.send('record not found', 400);
	// 		}
	//     });
	// });
	
	app.get('/reset', function(req, res) {
		Offer.delAllRecords( );
		res.redirect('/print');
	});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
