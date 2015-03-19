var mongoose = require('mongoose');
var timestamps = require('mongoose-time');
var autoIncrement = require('mongoose-auto-increment');


var uri = 'mongodb://app:KQ85J7UQPrgxvmQ@ds052827.mongolab.com:52827/coolfruit-dev';
mongoose.connect(uri);

var Schema = mongoose.Schema;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {

	autoIncrement.initialize(db);
	var blogPostSchema = new Schema({
		_id: Number,
		title: String,
		content: String,
		created_at: Date,
		updated_at: Date,
		published_at: Date,
		_author: { type: Number, ref: 'Author' },
		_category: { type: Number, ref: 'Category' }
	})
	blogPostSchema.plugin(timestamps());
	blogPostSchema.plugin(autoIncrement.plugin, 'BlogPost');
	var BlogPost = mongoose.model('BlogPost', blogPostSchema);

	var authorSchema = new Schema({
		_id: Number,
		name_display: String
	})
	authorSchema.plugin(timestamps());
	authorSchema.plugin(autoIncrement.plugin, 'Author');
	var Author = mongoose.model('Author', authorSchema);

	var categorySchema = new Schema({
		_id: Number,
		name: String
	})
	categorySchema.plugin(timestamps());
	categorySchema.plugin(autoIncrement.plugin, 'Category');
	var Category = mongoose.model('Category', categorySchema);
/*
	var andrew = new Author({
		name_display: "Andrew Duensing"
	})

	andrew.save(function(err){
		if(err) console.log('Error', err)
		else console.log('author saved');
	});
	var post = new BlogPost({
		title: "It's not a whole new post!",
		_author: 2
	});

	post.save(function(err){
		if(err) console.log('Error', err)
		else console.log('file saved');
	});
*/
	BlogPost
	.findOne({ _author : 2})
	.populate('_author')
	.exec(function (err, post) {
	  if (err) return handleError(err);
	  console.log('The creator is %s', post._author.name_display);
	  // prints "The creator is Aaron"
})
/*
	*/

});