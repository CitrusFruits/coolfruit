var ObjectId = require('mongoose-simpledb').Types.ObjectId;
var markdown = require('markdown').markdown;

exports.schema = {
	_id: Number,
	title: String,
	content: String,
	created_at: Date,
	updated_at: Date,
	_author: { type: Number, ref: 'Author' },
	_categories: [{ type: Number, ref: 'Category' }]
};

exports.methods = {
	contentHTML: function(){
		return markdown.toHTML(this.content, 'Maruku');
	},
};