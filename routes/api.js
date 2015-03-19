var db = require('mongoose-simpledb').db;
var bodyParser = require('body-parser');
var andrewsync = require('../andrewsync');
var bulk = require('../bulk');
var jade = require('jade');

var postFrag = jade.compileFile('views/admin/fragments/postpreview.jade');

module.exports = function(express) {
	// Make the router
	var router = express.Router();

	router.use(bodyParser.urlencoded({
		extended: true
	}));

	// POST savepost
	router.post('/savepost', function(req, res) {
		// Update
		if (req.body._id) {
			var query = {
				_id: req.body._id
			};
			db.BlogPost.findOneAndUpdate(
				query,
				req.body, {},
				function(err, data) {
					if (err) {
						console.log('document save error', err);
					} else {
						console.log('document saved');
						res.send({post: data});
					}
				}
			);
		}
		// New
		else {
			var post = new db.BlogPost(req.body);
			post.save(function(err, data) {
				if (err) {
					console.log('document save error', err);
				} else {
					console.log('document saved');
					res.send({post: data, rendered: postFrag({post: data})});
				}
			});
		}
	});

	// POST publishpost
	// saves a regular post and public post
	router.post('/publishpost', function(req, res) {
		// Update
		console.log(req.body);
		delete req.body.__v;
		if (req.body._id != undefined) {
			var query = {
				_id: req.body._id
			};
			// Parallel!
			andrewsync.parallel([
				function(callback) {
					db.BlogPostPublic.findOneAndUpdate(
						query,
						req.body, {
							upsert: true
						},
						callback
					);
				},
				function(callback) {
					db.BlogPost.findOneAndUpdate(
						query,
						req.body, {
							upsert: true
						},
						callback
					);
				}
			], makeSaveCallbackMultiple(res))
		}
		// New
		else {
			var post = new db.BlogPost(req.body);
			post.save(function(err, data) {
				if (err) {
					console.log('document save error', err)
				} else {
					req.body._id = data._id;
					var postPublic = new db.BlogPostPublic(req.body);
					postPublic.save(makeSaveCallback(res));
				}
			});
		}
	});

	// POST savecategories
	router.post('/savecategories', function(req, res) {
		if (!req.body.saved) {
			req.body.saved = [];
		}
		if(!req.body.deleted){
			req.body.deleted = []
		}
		var archivedDocs = []
		var archiveQueries = [];
		var removeQueries = []
		var isUsedFunctions = [];
		// Make the functions to test whether or not to
		// archive the deleted categories
		req.body.deleted.forEach(function(element){
			if(element._id != undefined){
				isUsedFunctions.push(function(cb){
					console.log('element', element);
					db.Category.isUsed(db, element, function(used, cat){
						if(used){
							console.log('archiving', cat.name_display);
							cat.archived = true;
							archivedDocs.push(cat);
							cb(cat);
						}
						else{
							console.log('removing', cat.name_display);
							removeQueries.push({_id: cat._id});
							cb(cat);
						}
					})
				});
			}
		});
		// Run all the functions
		andrewsync.parallel(
			isUsedFunctions,
			function(docs){
				andrewsync.parallel({
					"saved": function(callback){
						bulk.upsert(req.body.saved, db.Category, callback);
					},
					"archived": function(callback){
						bulk.upsert(archivedDocs, db.Category, callback);
					},
					"deleted": function(callback){
						db.Category.remove({$or: removeQueries}, callback);
					}
				},
				function(err, data){
					db.Category.find({}, function(err, data){
						res.send(data);
					});
				});
			}
		)

	});

	function makeSaveCallback(res) {
		return function(err, data) {
			if (err) {
				console.log('document save error', err);
			} else {
				console.log('document saved');
				res.send(data);
			}
		}
	}

	function makeSaveCallbackMultiple(res) {
		return function(err, data) {
			var numErrors = 0;
			for (var i = 0; i < err.length; i++) {
				if (err[i]) {
					console.log('documents save error', err[i]);
					numErrors++;
				}
			}
			if (numErrors == 0) {
				console.log('documents saved');
				res.send(data);
			}
		}
	}

	return router;
}