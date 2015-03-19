var simpledb = require('mongoose-simpledb');
var timestamps = require('mongoose-time');
var bcrypt = require('bcrypt-nodejs');
var andrewsync = require('./andrewsync');
var loremIpsum = require('lorem-ipsum')
var SALT_WORK_FACTOR = 10;


simpledb.init(
	{
		//connectionString: 'mongodb://app:KQ85J7UQPrgxvmQ@ds052827.mongolab.com:52827/coolfruit-dev'
		connectionString: 'mongodb://127.0.0.1:27017'
	},
	function(err, db){
		if (err) return console.error(err);
		db.BlogPost.schema.plugin(timestamps());
		db.BlogPostPublic.schema.plugin(timestamps());
		db.Category.schema.plugin(timestamps());
		db.Author.schema.plugin(timestamps());

		// Password hashing
		db.Author.schema.pre('save', function(next){
			var user = this;

			if(!user.isModified('password')) return next();

			bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
				if(err) return next(err);

				bcrypt.hash(user.password, salt, null, function(err, hash) {
					if(err) return next(err);
					user.password = hash;
					next();
				});
			});
		});
		if(!err) console.log('Database initialized');
		//console.log(BlogPost);

		/*
		var cat = new db.Category({
			name_display: "Great"
		});
		cat.save();
		var andrew = new db.Author({
			name_display: "hannah",
			password: "password",
			name_login: "hannah",
			admin: true
		})

		andrew.save(function(err){
			if(err) console.log('Error', err)
			else console.log('author saved');
		});
		*/
		/*
		*/

		// Time to generate some fake data
		/*andrewsync.parallel({
				"authors": function(callback){
					db.Author.find({}, callback);
				},
				"categories": function(callback){
					db.Category.find({}, callback);
				},
				"posts": function(callback){
					db.BlogPost.find({}).sort({created_at: -1}).exec(function(err, posts){
						for(var i = 0; i < posts.length; i++){
							if(posts[i].content){
								posts[i].content = posts[i].contentHTML();
							}
						}
						callback(err, posts);
					});
				}
			}, function(err, data){
				var authors = data.authors;
				var categories = data.categories;
				var aL = authors.length;
				var cL = categories.length;
				var i = 0;
				makeFake();
				function makeFake(){
					var fakeTitle = loremIpsum({
					    count: 1                      // Number of words, sentences, or paragraphs to generate. 
					  , units: 'sentence'            // Generate words, sentences, or paragraphs. 
					  , sentenceLowerBound: 2         // Minimum words per sentence. 
					  , sentenceUpperBound: 5        // Maximum words per sentence. 
					});
					var fakeContent = loremIpsum({
					    count: 4                      // Number of words, sentences, or paragraphs to generate. 
					  , units: 'paragraphs'            // Generate words, sentences, or paragraphs. 
					  , sentenceLowerBound: 5         // Minimum words per sentence. 
					  , sentenceUpperBound: 15        // Maximum words per sentence. 
					  , paragraphLowerBound: 5        // Minimum sentences per paragraph. 
					  , paragraphUpperBound: 12        // Maximum sentences per paragraph. 
					});
					var fakePost = {
					    "title" : fakeTitle,
					    "content" : fakeContent,
					    "_author" : authors[Math.floor(aL * Math.random())]._id,
					    "_categories" : [ categories[Math.floor(cL * Math.random())]._id ]
					}
					var post = new db.BlogPost(fakePost);
					post.save();
					i++;
					if(i < 50){
						setTimeout(makeFake, 2)
					}
				}
			}
		);*/
	}
);