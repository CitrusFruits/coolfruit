require('./database.js');
var db = require('mongoose-simpledb').db;
setTimeout(function(){
	console.log(db);
		post = new db.BlogPostPublic({
		"title": "Different title",
		"content": "Lorem ipsum Deserunt labore incididunt cupidatat proident enim nisi eu consequat quis minim nostrud sint non commodo adipisicing pariatur veniam labore exercitation exercitation magna Excepteur ea ut aliqua tempor sint dolor dolore elit proident in sit reprehenderit do nostrud nisi pariatur quis irure in Excepteur enim dolor eiusmod nostrud deserunt enim ad Ut commodo do Ut est adipisicing dolor ut nisi ut incididunt eiusmod occaecat fugiat ex dolore in minim officia esse nulla minim sunt sit eiusmod veniam enim commodo laboris officia pariatur Duis minim ut aliqua dolore sit dolor esse non Duis culpa esse ut dolore laborum nostrud dolor elit sint do aute velit pariatur deserunt officia cillum magna do fugiat laborum cillum in veniam adipisicing et consequat cillum pariatur nisi in anim amet voluptate magna qui ea deserunt qui do consectetur proident sed fugiat fugiat qui tempor ad veniam sunt dolor aute reprehenderit qui dolor aliqua sint incididunt ullamco tempor aliquip sed in anim cupidatat exercitation voluptate amet deserunt id adipisicing non sed deserunt Duis Duis voluptate anim eu pariatur mollit elit id nulla in consequat esse in non labore Duis eu velit cupidatat veniam veniam commodo aute in dolore eiusmod eu Ut velit Ut et incididunt dolor ullamco cupidatat labore anim do amet nisi laborum cillum aliqua sunt dolore eiusmod quis adipisicing deserunt sint do aute labore enim labore et dolore officia ad et aliqua sed consequat ad et nostrud ullamco ullamco est deserunt Duis cillum Duis qui et velit tempor aute dolor deserunt mollit mollit incididunt nisi ut pariatur tempor esse nisi sunt officia id in sunt."
	});
	post.save(function(err, data){
		if(err) console.log('Error', err)
		else console.log(data);
	});
}, 3000)