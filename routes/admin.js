var db = require('mongoose-simpledb').db;
var andrewsync = require('../andrewsync');
var markdown = require('markdown').markdown;
var passport = require('passport');
var async = require('async');
var bulk = require('../bulk');
var LocalStrategy = require('passport-local');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;
var jade = require('jade');

var postFrag = jade.compileFile('views/admin/fragments/postpreview.jade');
var authorRowFrag = jade.compileFile('views/admin/fragments/authorRow.jade');

module.exports = function(express){
	var router = express.Router();
	
	router.use(bodyParser.urlencoded({ extended: true }));
	router.use(session({
	  secret: 'carts for hire',
		resave: true,
		saveUninitialized: true
	}));
	router.use(passport.initialize());
	router.use(passport.session());

	// GET login
	router.get('/login', function(req, res){
		res.render('admin/login');
	});


	// POST login
	router.post('/login',
		passport.authenticate('local', {
	    successRedirect: '/admin',
	    failureRedirect: 'login'
	  })
	);

	router.use(ensureAuthenticated);


	router.get('/', mainRoute);
	router.get('/cf/:page', mainRoute);
	function mainRoute(req, res){
		console.log(req.params.page);
		andrewsync.parallel({
				"authors": function(callback){
					db.Author.find({}, callback);
				},
				"categories": function(callback){
					db.Category.find({}, callback);
				},
				"posts": function(callback){
					db.BlogPost.find({}).limit(3).sort({created_at: -1}).exec(function(err, posts){
						for(var i = 0; i < posts.length; i++){
							if(posts[i].content){
								posts[i].content = posts[i].contentHTML();
							}
						}
						callback(err, posts);
					});
				}
			}, 
			function(err, data){
				var page = req.params.page || 'none';
				res.render(
					'admin/main', 
					{	
						posts: data.posts, 
						authors: data.authors, 
						categories: data.categories, 
						posts: data.posts, 
						post: {
							title: "",
							content: ""
						},
						user: req.user,
						page: page
					}
				);
			}
		);
	}

	// GET login
	router.get('/logout', function(req, res){
		req.logout();
  	res.redirect('/admin/');
	});

	// GET newauthor
	router.get('/newauthor', adminGET, function(req, res){
		res.render('admin/newauthor');
	});

	// GET updatepassword
	router.get('/updatepassword', function(req, res){
		res.render('admin/updatepassword');
	});

	// POST updateauthor
	router.post('/updateauthor', function(req, res){
		console.log(req.body);
		console.log(req.user);
		// Update the data
		for(var key in req.body){
			req.user[key] = req.body[key];
		}
		db.Author.findOneAndUpdate({
			_id: req.user._id},
			req.user.toObject(), {},
			function(err, data){
				if(err){
					console.log('POST /updateauthor error', err);
					res.status(500).send('Database write error');
				}
				else{
					res.send('success');
				}
			}
		);
	});

	// POST updateauthor
	router.post('/updateauthors', adminPOST, function(req, res){
		console.log('authors', req.body);
		//console.log(req.user);
		var toUpdate = [];
		var removeQueries = [];
		req.body.authors.forEach(function(author){
			if(author.delete){
				console.log('removing', author.name_display);
				removeQueries.push({_id: author._id});
			}
			else{
				toUpdate.push(author);
			}
		});
		andrewsync.parallel({
				"saved": function(callback){
					bulk.upsert(toUpdate, db.Author, callback);
				},
				"deleted": function(callback){
					db.Author.remove({$or: removeQueries}, callback);
				}
			},
			function(err, data){
				var sendErr = false;
				for (var key in err) {
					if(err[key] && err[key].lenght > 0){
						sendErr;
					}
				}
				if(sendErr){
					res.status(500).send(err);
					console.log('POST /updateauthors error', rr)
				}
				else{
					res.send('success');
				}
			}
		);
	});

	// POST updatepassword
	router.post('/updatepassword', function(req, res){
		console.log(req.body);
		console.log(req.user);
		req.user.comparePassword(req.body.current_password, function(err, isMatch) {
			if (err){
				console.log('POST /updatepassword error', err);
				res.status(500).send({error: 'Database read error'});
			}
			if(isMatch) {
				req.user.password = req.body.new_password;
				bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
					if(err) res.status(500).send('Database write error');

					bcrypt.hash(req.user.password, salt, null, function(err, hash) {
						if(err) res.status(500).send('Database write error');
						req.user.password = hash;
						// Update the data
						db.Author.findOneAndUpdate(
							{	_id: req.user._id },
							req.user.toObject(), {},
							function(err, data){
								if(err){
									console.log('POST /updatepassword error', err);
									res.status(500).send({error: 'Database write error'});
								}
								else{
									res.send({message: 'success'});
								}
							}
						);
					});
				});
			}
			else {
				res.send({error: 'Wrong password'});
			}
		});
	});

	// POST newauthor
	router.post('/newauthor', adminPOST, function(req, res){
		console.log(req.body);
		var message = [];
		async.waterfall([
			// Check for duplicate authors
			function(callback){
				db.Author.findOne(
					{name_login: req.body.name_login}, 
					function(err, data){
						if(err){
							callback(err);
						}
						else if(data){
							message =  'login name already taken';
							callback('login taken');
						}
						else{
							callback(null);
						}
					}
				);
			},
			// Save the author
			function(author, callback){
				var author = new db.Author(req.body);
				author.save(function(err, data){
					if(err){
						console.log('database write error', err);
						callback(err);
					}
					else{
						res.send({message: 'success', rendered: authorRowFrag({author: author})});
					}
				});
			}
		], 
		function(err, result){
			if(err){
				if(message){
					res.send({ message: message })	
				}
				else{
					console.log('POST /newauthor error', err);
					res.status(500).send({error: 'something went wrong'})
				}
			}
		});
	});
	
	// POST refresh
	router.post('/refresh', function(req, res){
		console.log('refreshing', req.body);
		switch(req.body.model){
			case 'authors':
				db.Author.find({}, function(err, data){
					if(err) res.status(500).send(err);
					else res.send(data);
				});
				break;
			case 'posts':
				db.Category.find({}, function(err, data){
					if(err) res.status(500).send(err);
					else res.send(data);
				});
				break;
			case 'categories':
				db.BlogPost.find({}, function(err, data){
					if(err) res.status(500).send(err);
					else res.send(data);
				});
				break;
		}
	});

	// POST getpost
	router.post('/getpost', function(req, res){
		db.BlogPost.findById(req.body.id, function(err, data){
			if(err) res.status(500).send('Database write error');
			else res.send(data);
		});
	});

	// POST getpost
	// minDate: the earliest date that a post could have occured at
	// render: whether or not to return rendered post fragments
	router.post('/getposts', function(req, res){
		var query = {};
		var renders = []
		if(req.body.minDate){
			query = {created_at: {$lt: req.body.minDate}};
		}
		db.BlogPost.find(query).limit(2).sort({created_at: -1}).exec(function(err, data){
			for (var i = 0; i < data.length; i++) {
				if(data[i].content){
					data[i].content = data[i].contentHTML();
					renders[i] = postFrag({post: data[i]});
				}
			};
			if(err) res.status(500).send('Database write error');
			else res.send({posts: data, postsRendered: renders});
		});
	});

	router.post('/removepost', function(req, res){
		db.BlogPost.findById(req.body.id).remove().exec(function(err){
			if(err) res.status(500).send('Database write error');
			else res.send('removed');
		});
	});

	return router;
};

// Passport (De)Serialization
passport.serializeUser(function(author, done) {
  done(null, author._id);
});

passport.deserializeUser(function(id, done) {
  db.Author.findById(id, function (err, author) {
    done(err, author);
  });
});





// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(function(username, password, done) {
	console.log('username, password', username, password);
	db.Author.findOne({ name_login: username }, function(err, user) {
		if (err) { return done(err); }
		if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
		user.comparePassword(password, function(err, isMatch) {
			console.log("its a " + isMatch + "match!");
			if (err) return done(err);
			if(isMatch) {
				return done(null, user);
			}
			else {
				return done(null, false, { message: 'Invalid password' });
			}
		});
	});
}));

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
	/*req.user = {
		name_login: 'fake',
		name_display: 'Fakey Fake McFake',
		admin: true
	};
	return next();*/
	if (req.isAuthenticated()) { return next(); }
	res.redirect('/admin/login');
}

function adminGET(req, res, next){
	if(req.user.admin){
		return next();
	}
	else{
		res.redirect('/admin')
	}
}
function adminPOST(req, res, next){
	if(req.user.admin){
		return next();
	}
	else{
		res.status(403).send('Access Denied');	
	}
}