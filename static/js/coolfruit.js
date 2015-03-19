// Coolfruit core methods
var fruit = {
	events: {
		events: [],
		subscribe: function(eventName, callback){
			if(!this.events[eventName]){
				console.log('here');
				this.events[eventName] = {
					name: eventName,
					functions: []
				};
			}
			this.events[eventName].functions.push(callback);
		},
		publish: function(eventName){
			// Don't bother publishing events no one is subscribed to
			if(this.events[eventName]){
				var event = this.events[eventName];
					for(var i = 0; i < event.functions.length; i++){
						event.functions[i](event.name);
					}
				}
		}
	},
	refresh: function(model){
		console.log('refreshing');
		$.ajax({
			type: "POST",
			url: "/admin/refresh",
			data: {model: model},
			success: function(resp){
				console.log('refreshed: ' + model);
				switch(model){
					case 'authors':
						authors = resp;
						break;
					case 'posts':
						posts = resp;
						break;
					case 'categories':
						categories = resp;
						break;
				}
				fruit.events.publish('refresh.' + model);
			}
		});
	},
	utils: {
		getIndex: function(arr, key, value){
			for(var i = 0; i < arr.length; i++){
				if(arr[i][key] == value){
					return i;
				}
			}
			return -1;
		},
		scrollDist: function(el){
			var a = el.scrollTop;
			var b = el.scrollHeight - el.clientHeight;
			return b - a;	
		},
		canScroll: function(el){
			return el.scrollHeight !== el.clientHeight;
		}
	},
	alert: function(message, options, callback){
		var box = $('<div class="alert">');
		var uiBlock = $('<div class="uiBlock">');
		box.append('<div class="message">' + message + '</div>');

		var buttons = $('<div class="buttons">');
		var focusButton;

		if(options && options.length){
			var optionButtons = [];
			for (var i = 0; i < options.length; i++) {
				var button = $('<button index="'+i+'">'+options[i]+'</button>');
				button.addClass('button');
				button.on('click', optionCallback);
				buttons.append(button);
				if(i == 0){
					focusButton = button;
				}
			}
		}

		box.append(buttons);
		$('body').append(uiBlock);
		$('body').append(box);
		focusButton.focus();

		function optionCallback(e){
			box.remove();
			uiBlock.remove();
			callback($(e.target).attr('index'));
		}
	},
	tabs: {
		history: [],
		currentTab: '',
		init: function(){
			$('#navBar li').on('click', function(e){
				if($(e.target).attr('content-id')){
					fruit.tabs.showTab($(e.target).attr('content-id'));
				}
			});
		},
		showTab: function(contentId){
			if(this.currentTab !== ''){
				history.push(this.currentTab);
			}
			$('.tabContent').addClass('dnone');
			var content = $('#' + contentId);
			$(content).removeClass('dnone');
			fruit.events.publish('tabshow.' + contentId);
			window.history.pushState("cool fruit", "Cool Fruit Admin", '/admin/cf/' + contentId);

			$(window).bind('keydown', function(event) {
				if (event.ctrlKey || event.metaKey) {
					switch (String.fromCharCode(event.which).toLowerCase()) {
						case 'b':
							$('#navBar').toggleClass('dnone');
							break;
					}
				}
			});

			fruit.tabs.current = contentId;
			console.log(fruit.tabs.current);
		}
	},
	toggleDark: function(){
		var body = $('body');
		body.toggleClass('dark');
		body.toggleClass('light');
		if(body.hasClass('dark')){
			$.jStorage.set('theme', 'dark');
		}
		else{
			$.jStorage.set('theme', 'light');
		}
	}
};