// module dependencies
var CT  = require('./modules/country-list');
var AM  = require('./modules/account-manager');
var EM  = require('./modules/email-dispatcher');

var CAT = require('./modules/categories');

var mongoose = require('mongoose')

module.exports = function (app) {

  "use strict";

// main login page //



  app.get('/', function (req, res) {
    console.log('login', req.cookies.user, req.cookies.pass);
    if (req.cookies.user == undefined || req.cookies.pass == undefined ) {
      AM.getAllRecords( function(e, docs){
        res.render('index', {
          locals: {
              categories : CAT
            , title      : 'Outside'
            , offers : docs
            , user : req.cookies.user
          }
        });
      });
      console.log('Unidentified user has landed on "/"');
    } else {
      AM.getAllRecords( function(e, docs){
        res.render('index', { 
          locals: {
              categories : CAT
            , title      : 'Inside'
            , offers : docs
            , user       : req.cookies.user
            , udata      : req.session.user
          }
        });
      });
      console.log('User ' + req.cookies.user + ' redirected to "/"');
    }
  });

  app.post('/', function (req, res) {
    if (req.param('email') != null) {
      AM.getEmail(req.param('email'), function(o){
        if (o){
          res.send('ok', 200);
          EM.send(o, function (e,m) { console.log('error : ' + e, 'msg : ' +m)});
        } else {
            res.send('email-not-found', 400);
        }
      });
    } else {

      AM.manualLogin(req.param('user'), req.param('pass'), function (e,o) {
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
             title: 'Hello - Please Login To Your Account'
           , user: req.cookies.user
            /* offers: docs */
          }
        });
        console.log('Unidentified user has landed on "/login"');
      } else {
    // attempt automatic login //
        AM.autoLogin(req.cookies.user, req.cookies.pass, function (o) {
          if (o !== null) {
              req.session.user = o;
            res.redirect('/home');
            console.log('User ' + req.cookies.user + ' redirected to "/home"');
          } else {
            res.render('login', {
              locals: {
                  categories : CAT
                , title: 'Hello - Please Login To Your Account'
                , user: req.cookies.user
                /* , offers: docs */
              }
            });
          }
      })
    }
	});
	
	app.post('/login', function (req, res) {
		if (req.param('email') != null) {
			AM.getEmail(req.param('email'), function(o){
				if (o){
					res.send('ok', 200);
					EM.send(o, function(e, m){ console.log('error : '+e, 'msg : '+m)});	
				}	else{
					res.send('email-not-found', 400);
				}
			});
		} else {
		// attempt manual login //
			AM.manualLogin(req.param('user'), req.param('pass'), function(e, o){
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
            categories : CAT
					, title : 'Your Account'
          , offers: docs
          , user: req.cookies.user
					, udata : req.session.user
          }
        });
	    }
	});
	
	app.post('/home', function (req, res) {
		if (req.param('user') != undefined) {
			AM.update({
				user            : req.param('user'),
				name            : req.param('name'),
				email           : req.param('email'),
				pass            : req.param('pass'),
				business_name   : req.param('business_name'),
				business_phone  : req.param('business_phone'),
				coupon_title    : req.param('coupon_title'),
				coupon_body     : req.param('coupon_body'),
				coupon_supra: req.param('coupon_supra'),
				coupon_sub : req.param('coupon_sub'),
				coupon_price: req.param('coupon_price'),
				address_street  : req.param('address_street'),
				address_city    : req.param('address_city'),
				address_state   : req.param('address_state'),
				address_zip     : req.param('address_zip'),
				county: req.param('county'),
				location : req.param('location'),
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
        title: 'Signup',
        user: req.cookies.user
      }
		});
	});
	
	app.post('/signup', function(req, res){
		AM.signup({
			name            : req.param('name'),
			email           : req.param('email'),
			user            : req.param('user'),
			pass            : req.param('pass'),
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
		AM.validateLink(req.query["u"], function(e){
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
		AM.setPassword(req.param('pid'), req.param('pass'), function(o){
			if (o){
				res.send('ok', 200);
			}	else{
				res.send('unable to update password', 400);
			}
		})
	});	
	
	
// view & delete accounts //
	
	app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, docs){
			res.render('print', {
        locals: {
            title : 'Account List'
          , accts :  docs
        } 
      });
		})
	});	
	
	app.post('/delete', function(req, res){
		AM.delete(req.body.id, function(e, obj){
			if (!e){
				res.clearCookie('user');
				res.clearCookie('pass');
	            req.session.destroy(function(e){ res.send('ok', 200); });
			}	else{
				res.send('record not found', 400);
			}
	    });
	});
	
	app.get('/reset', function(req, res) {
		AM.delAllRecords( );
		res.redirect('/print');
	});
	
	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });

};
