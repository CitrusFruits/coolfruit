var db = require('mongoose-simpledb').db;
var markdown = require('markdown').markdown;

module.exports = function(express){
	// Make the router
	var router = express.Router();

	// GET post
	router.get('/post/:id', function(req, res){
		db.BlogPostPublic.findOne({_id: req.params.id})
		.populate('_author')
		.exec(function(err, data){
				if(err || data == null)
					res.render('public/404');
				else{	
					data.content = data.contentHTML();
					res.render('public/blogpost', { post: data });
				}
		});
	});

	router.get('/browseposts', function(req, res){
		db.BlogPostPublic.find(
			{},
			function(err, data){
				console.log(data.length);
				res.render('admin/browseposts', { posts: data });
		});
	});

	//The 404 Route (ALWAYS Keep this as the last route)
	router.get('*', function(req, res){
	  res.render('public/404');
	});

	return router;
}