var bulk = require('./bulk');
bulk.upsert();
/*var andrewsync = require('./andrewsync');

var arr = {
	"hey": 1
};

andrewsync.parallel({
	"one": function(callback){
		setTimeout(function(){
			//console.log(2);
			callback(2, 'b');
		}, 300)
	},
	"two": function(callback){
		setTimeout(function(){
			//console.log(1);
			callback(1, 'a');
		}, 200)
	},
	},
	function(num, letter){
		console.log('done', num, letter);
	});
*/