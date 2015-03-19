var ObjectId = require('mongoose-simpledb').Types.ObjectId;
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;

exports.schema = {
	_id: Number,
	name_display: String,
	admin: {type: Boolean, default: false},
	name_login: { type: String, required: true, unique: true},
	password: { type: String, required: true, unique: true},
	picture_url: String
};

exports.methods = {
	comparePassword: function(candidatePassword, cb) {
		bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
			if(err){
				return cb(err);
			} 
			cb(null, isMatch);
		});
	}
}