// An asynchronous parallel function with support for
// key value pair type arrays
exports.parallel = function(fns, done){
	var r = Math.random();
	if(fns.length == 0){
		//console.log('calling back 0', r);
		done.apply(this, {});
		return;
	}
	var results = new Array();
	var cbCount = 0;
	var length = 0;
	var finished = false;
	for(var key in fns){
		length++;
	}
	for(var key in fns){
		fns[key](makeCallback(key));
	}
	// construct a custom callback with a 
	// custom key for each function
	function makeCallback(k){
		return function(){
			var key = k;
			cbCount++;
			for(var i = 0; i < arguments.length; i++){
				if(results[i] == undefined) results[i] = [];
				results[i][key] = arguments[i];
			}
			if(cbCount == length && !finished){
				finished = true;
				done.apply(this, results);
				return;
			}
		}
	}
}