var andrewsync = require('./andrewsync');

function countErrors(err){
	if(typeof(err) == 'undefined'){
		return 0;
	}
	var numErrors = 0;
	for (var i = 0; i < err.length; i++) {
		if (err[i]) {
			numErrors++;
		}
	}
	return numErrors;
}

exports.upsert = function(toSave, model, callback){
	var saved = [];
	var findFns = [];
	var insertFns = [];
	var updateFns = [];
	// Can't foreach a non array
	if(toSave == undefined || toSave.length == 0){
		callback([], []);
		return;
	}
	toSave.forEach(function(element) {
		findFns.push(function(cb) {
			var query = {
				_id: element._id
			};
			model.findOne(
				query,
				element,
				cb
			);
		});
	});

	// Parallel find the documents
	andrewsync.parallel(findFns, function(err, data) {
		if(countErrors(err) > 0){
			callback(err);
			return;
		}
		// Iterate through all the data
		data.forEach(function(element, index, array) {
			// If any are null, insert them to insertFns
			if (null == element) {
				insertFns.push(function(cb) {
					var cat = new model(toSave[index])
					cat.save(cb);
				});
			}
			// Otherwise we're just updating them
			else {
				updateFns.push(function(cb) {
					var query = {
						_id: toSave[index]._id
					};
					var doc = toSave[index];
					delete doc._id;
					model.findOneAndUpdate(
						query,
						doc, {},
						cb
					);
				});
			}
		});
		// Insert what needs to be inserted
		andrewsync.parallel(insertFns, function(err, data) {
			if(countErrors(err) > 0){
				callback(err);
				return
			}
			if (data) {
				data.forEach(function(element) {
					saved.push(element);
				});
			}

			// Update what needs to be updated
			andrewsync.parallel(updateFns, function(err, data) {
				if(countErrors(err) > 0){
					callback(err);
					return;
				}
				if (data) {
					data.forEach(function(element) {
						saved.push(element);
					});
				}
				callback([], saved);
				return;
			});
		})
	});
}