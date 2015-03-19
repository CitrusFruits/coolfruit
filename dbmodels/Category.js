var ObjectId = require('mongoose-simpledb').Types.ObjectId;
var andrewsync = require('../andrewsync');

exports.schema = {
	_id: Number,
	name_display: String,
	archived: { type: Boolean, default: false }
};

exports.statics = {
	isUsed: function(db, category, callback){
		andrewsync.parallel([
			function(cb){
				db.BlogPost.findOne({_categories: category._id}, cb);
			},
			function(cb){
				db.BlogPostPublic.findOne({_categories: category._id}, cb);
			}
		],
		function(err, data){
			if(data[0] != null || data[1] != null){
				callback(true, category);
			}
			else{
				callback(false, category);
			}
		});
	}
}