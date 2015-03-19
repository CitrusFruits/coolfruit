var pages = {
	author: {
		init: function(){
			fruit.events.subscribe('tabshow.author', this.onShow);

			$('#pictureUrl').on('change', function(e){
				$('#profilePicPreview').attr('src', e.target.value);
			});
		},
		onShow: function(){
			$(window).unbind('keydown');
			// Ctrl or Cmd + S to save
			$(window).bind('keydown', function(event) {
				if (event.ctrlKey || event.metaKey) {
					switch (String.fromCharCode(event.which).toLowerCase()) {
						case 's':
							event.preventDefault();
							pages.author.save();
							break;
					}
				}
			});
		},
		save: function(){
			console.log('saving');
			var data = {
				name_display: $("#nameDisplay").val(),
				picture_url: $("#pictureUrl").val()
			};
			if(data.pictureUrl === ''){
				delete data.pictureUrl;
			}
			$.ajax({
				type: "POST",
				url: "/admin/updateauthor",
				data: data,
				success: function(resp){
					console.log(resp);
					fruit.refresh('authors');
				}
			});
		},
		updatePassword: function(){
			fruit.tabs.showTab('updatepassword');
		}
	},
	updatePassword:{
		init: function(){
			fruit.events.subscribe('tabshow.updatepassword', function(){
				$('#updatePassword input').val('');
			});
		},
		save: function(){
			console.log('saving');
				var data = {
					current_password: $("#currentPass").val(),
					new_password: $("#newPass").val()
				};
				console.log(data);
				if(data.new_password != $("#confirmPass").val()){
					$('#alert').html('Passwords do not match');
				}
				else{
					$('#alert').html('');
					$.ajax({
						type: "POST",
						url: "/admin/updatepassword",
						data: data,
						success: function(resp){
							console.log(resp);
							if(resp.message == 'success'){
								fruit.tabs.showTab('profile');
							}
							else if(resp.error){
								$('#updatePassword .error').removeClass('dnone');
								$('#updatePassword .error').html(resp.error);				
							}
						}
					});
				}
		}
	},
	writePost: {
		init: function(){
			fruit.events.subscribe('refresh.authors', this.updateAuthors);
			fruit.events.subscribe('refresh.categories', this.updateCategories);
			fruit.events.subscribe('tabshow.writepost', this.onShow);

			// Wide area
			//wideArea();
			var self = this;

			// Markdown editor
			function Editor(input, preview) {
				console.log(input);
				this.update = function () {
					if(!$('#previewPost').hasClass('dnone')){
						var text = '#' + $('#postTitle').val() + '\n' + input.value;
						preview.innerHTML = markdown.toHTML(text, 'Maruku');
					}
				};
				input.editor = this;
				this.update();
			}
			var $m = function (id) { return document.getElementById(id); };
			this.editor = new Editor($m("postText"), $m("previewPost"));
			// DOESN"T WORK YET
			$('#postTitle').on('input', function(){
				console.log('yo');
				self.editor.update();
			});

			$('#postText').on('input', function(){
				setTimeout(function() {
					self.editor.update();
				}, 10);
			});

			// Globalish variables
			delete this.newPost.__v;

			this.loadPost();
		},
		onShow: function(){
			console.log('writepost show');
			$(window).unbind('keydown');
			// Ctrl or Cmd + S to save
			$(window).bind('keydown', function(event) {
				if (event.ctrlKey || event.metaKey) {
					switch (String.fromCharCode(event.which).toLowerCase()) {
						case 's':
							event.preventDefault();
							pages.writePost.save();
							break;
						case 'p':
							console.log('here');
							event.preventDefault();
							pages.writePost.publish();
							break;
						case 'i':
							event.preventDefault();
							$('#cheatSheet').toggleClass('dnone');
							break;
					}
				}
			});
		},
		save: function(){
			$.ajax({
				type: "POST",
				url: "/api/savepost",
				data: this.updatePost(),
				success: function(resp){
					var post = resp.post;
					var rendered = resp.rendered;
					pages.writePost.newPost._id = post._id;
					var i = fruit.utils.getIndex(posts, '_id', post._id);
					if(i < 0){
						posts.splice(0, 0, post);
						pages.browsePosts.addPost(rendered);
					}
					else{
						posts[i] = post;
					}
					console.log(i);
					$('#savedAlert').text('Saved').show().fadeOut(1000);
					fruit.events.publish('refresh.posts');
				}
			});
		},
		publish: function(){
			var post = this.updatePost();
			fruit.alert(
				'Are you sure you want to publish "' + post.title + '"?',
				['Yes', 'No'],
				function(index){
					console.log(index);
					if(index == 0){
						console.log('publishing');
						$.ajax({
							type: "POST",
							url: "/api/publishpost",
							data: post,
							success: function(resp){
								$('#savedAlert').text('Published').show().fadeOut(1000);
							}
						});
					}
				}
			);
		},
		updatePost: function(){
			var idString = "#{post._id}";

			this.newPost.title = $('#postTitle').val();
			this.newPost.content = $('#postContent textarea').val();
			this.newPost._author = $("#writepost #postAuthor option:selected").val();

			console.log(this.newPost);
			return this.newPost;
		},
		updateAuthors: function(){
			var tempAuthor = $("#writepost #postAuthor option:selected").val();
			var authorSelect = $("#writepost #postAuthor");
			authorSelect.empty();
			for (var i = 0; i < authors.length; i++) {
				var option = $([
					'<option ',
					'author-id="' + authors[i]._id + '"',
					'value="' + authors[i]._id + '"',
					'">',
					authors[i].name_display,
					'</option>'
				].join(''));
				authorSelect.append(option);
			}
			if(pages.writePost.newPost._author){
				authorSelect.val(pages.writePost.newPost._author);
			}
			else{
				authorSelect.val(user.name_display);
			}
		},
		updateCategories: function(){
			var newSelect = $('<select id="postCategories" multiple data-placeholder="Select categories">'); 
			for (var i = 0; i < categories.length; i++) {
				var c = categories[i];
				if(!c.archived){
					newSelect.append([
						'<option ',
						'id="cat-'+c._id+'"',
						'category-id="'+c._id+'">',
						categories[i].name_display,
						'</option>'
					].join(''));
				}
			}
			$('#writepost #postCategories').empty();
			$('#writepost #postCategories').append(newSelect);
			
						// Select the right categories
			var kiddos = newSelect.children();
			for(var i = 0; i < kiddos.length; i++){
				var id = kiddos[i].getAttribute("category-id");
				if(pages.writePost.newPost._categories){
					for(var j = 0; j < pages.writePost.newPost._categories.length; j++){
						if(id == pages.writePost.newPost._categories[j]){
							kiddos[i].selected = true;
						}
					}
				}
			}

			// NOTE: chosen doesn't work on mobile
			newSelect.chosen({
					width: "200px"
			})
			// Update chosen changes
			.change(function(e){
				pages.writePost.newPost._categories = [];
				for(var i = 0; i < e.target.length; i++){
					if(e.target[i].selected){
						pages.writePost.newPost._categories.push(e.target[i].getAttribute("category-id"));	
					}
				}
			});
		},
		loadPost: function(id){
			if(id === undefined || id <= 0){
				pages.writePost.ogPost = {
					title: '',
					content: '',
					categories: [],
					_author: user._id
				};
				finishIt();
			}
			else{
				$.ajax({
					type: "POST",
					url: "/admin/getpost",
					data: {id: id},
					success: function(resp){
						console.log(resp);
						pages.writePost.ogPost = resp;
						finishIt();
					}
				});
			}
			function finishIt(){
				pages.writePost.newPost = pages.writePost.ogPost;
				$('#postTitle').val(pages.writePost.newPost.title);
				$('#postContent textarea').val(pages.writePost.newPost.content);
				$('#postAuthor').val(pages.writePost.newPost._author);
				pages.writePost.editor.update();
				pages.writePost.updateCategories();
				pages.writePost.updateAuthors();
			}
		},
		toggleView: function(){
			$('#editPost').attr('width', '50%');
			$('#previewPost').attr('width', '50%');
			$('#previewPost').toggleClass('dnone');
		}
	},
	manageAuthors: {
		init: function(){
			fruit.events.subscribe('tabshow.manageauthors', this.onShow);
			$('.deleteAuthor').on('click', function(e){
					var target = $(e.target);
					target.parent().parent().toggleClass('delete');
				});
		},
		save: function(){
			var rows = $('#authorsTable tr.authorData');

			// Start at 1 so we don't include the header
			for(var i = 1; i < rows.length; i++){
				var row = $(rows[i]);
				var index = fruit.utils.getIndex(authors, '_id', parseInt(row.attr('author-id')));
				console.log(row, row.attr('author-id'));
				authors[index].admin = row.find('.isAdmin').prop('checked');
				if(row.hasClass('delete')){
					authors[index].delete = true;
					row.remove();
				}
			}
			console.log('authors', authors);
			$.ajax({
				type: "POST",
				url: "/admin/updateauthors",
				data: {
					authors: authors
				},
				success: function(resp){
					console.log(resp);
					fruit.refresh('authors');
				}
			});
		},
		onShow: function(){
			console.log('authors show');
			// Ctrl or Cmd + S to save
			$(window).unbind('keydown');
			$(window).bind('keydown', function(event) {
				if (event.ctrlKey || event.metaKey) {
					switch (String.fromCharCode(event.which).toLowerCase()) {
						case 's':
							event.preventDefault();
							pages.manageAuthors.save();
							break;
					}
				}
			});
		}
	},
	categories:{
		init: function(){
			this.bindDelete();
			this.bindRestore(); 
			fruit.events.subscribe('tabshow.categories', this.show);
		},
		save: function(){
			var catInputs = $('#categoriesPage input');
			var saveCats = [];
			var deleteCats = [];
			for(var i = 0; i < catInputs.length; i++){
				var cat = $(catInputs[i]);
				var doc = {};
				var id = cat.attr("doc-id");
				if(id !== undefined){
					doc = this.getCategoryById(id);
				}
				doc.name_display = cat.val();
				if(cat.parent().parent().hasClass('delete')){
					deleteCats.push(doc);
				}
				else{
					if(cat.parent().parent().hasClass('restore')){
						doc.archived = false;
					}
					saveCats.push(doc);
				}
			}
			$.ajax({
				type: "POST",
				url: "/api/savecategories",
				data: {
					saved: saveCats,
					deleted: deleteCats
				},
				success: function(resp){
					categories = resp;
					//console.log(resp)
					// Refresh the table
					var tableActive = $('#categoriesPage table.active').empty();
					var tableArchived = $('#categoriesPage table.archived').empty();
					for(var i = 0; i < resp.length; i++){
						var row = $('<tr>');
						var input = $('<input value="' + resp[i].name_display + '" doc-id="' + resp[i]._id + '">');

						row.append($('<td class="name">').append(input));
						if(resp[i].archived){
							tableArchived.append(row);
							row.append($('<td><span class="btnRestore icon icon-plus"></span></td>'));
						}
						else{
							tableActive.append(row);
							row.append($('<td><span class="btnDelete icon icon-cross"></span></td>'));
						}
					}
					pages.categories.bindDelete();
					pages.categories.bindRestore();

					// Let the world know things have changed
					fruit.events.publish('refresh.categories');
				}
			});
		},
		show: function(){
			// Ctrl or Cmd + S to save
			$(window).unbind('keydown');
			$(window).bind('keydown', function(event) {
				if (event.ctrlKey || event.metaKey) {
					switch (String.fromCharCode(event.which).toLowerCase()) {
						case 's':
							event.preventDefault();
							pages.categories.save();
							break;
					}
				}
			});
		},
		addRow: function(){
			var row = $('<tr>');
			var input = $('<td><input value="New Category"></input></td>');
			var button = $('<td><span class="btnDelete icon icon-cross"></span></td>');
			row.append([input, button]);
			$("#categoriesPage table.active").prepend(row);
			this.bindDelete(button);
		},
		bindDelete: function($el){
			if(!$el){
				$el = $('.btnDelete');
			}
			$el.on('click', function(e){
				var target = $(e.target);
				target.parent().parent().removeClass('restore');
				target.parent().parent().toggleClass('delete');
			});
		},
		bindRestore: function($el){
			if(!$el){
				$el = $('.btnRestore');
			}
			$el.on('click', function(e){
				var target = $(e.target);
				target.parent().parent().removeClass('delete');
				target.parent().parent().toggleClass('restore');
			});
		},
		getCategoryById: function(id){
			for(var i = 0; i < categories.length; i++){
				if(categories[i]._id == id){
					return categories[i];
				}
			}
		}
	},
	browsePosts:{
		init: function(){
			fruit.events.subscribe('refresh.posts', function(){
				console.log('refreshing posts');
				// Reset the content on refresh
				$('.postPreview').each(function(index, element){
					var $el = $(element);
					console.log($el.attr('post-id'));
					var i = fruit.utils.getIndex(posts, '_id', $el.attr('post-id'));
					$el.find('.content').html(posts[i].content);
					$el.find('.title').html(posts[i].title);
				});
			});


			// Infinite scrolling
			var INFINITE_BUFFER = 250;
			$(document).ready(function() {
				var loading = false;
				
				// Initial
				var el = document.getElementById('tdContent');
				if(!fruit.utils.canScroll(el)){
					load(el);
				}

				$(window).resize(function(e){
					console.log('resized');
					if(!fruit.utils.canScroll(el)){
						load(el);
					}
				});

				// On Scroll
				$('#tdContent').scroll(function(e){
					if(fruit.tabs.current == 'browse' && !loading && fruit.utils.scrollDist(e.target) < INFINITE_BUFFER){
						load(e.target);
					}
				});
				function load(el, callback){
					loading = true;
					$.ajax({
						type: "POST",
						url: "/admin/getposts",
						data: {minDate: posts[posts.length-1].created_at, render: true},
						success: function(resp){
							if(resp.posts){
								for (var i = 0; i < resp.posts.length; i++) {
									posts.push(resp.posts[i]);
								}
							}
							if(resp.postsRendered){
								for (var i = 0; i < resp.postsRendered.length; i++) {
									$('#previews').append(resp.postsRendered[i]);
								}
							}
							// If the current tab is browse
							// And we got posts in our response
							// And the scroll distance is less than the appropriate amount or
							// the div isn't scrollable
							if(fruit.tabs.current == 'browse' && resp.posts && (fruit.utils.scrollDist(el) < INFINITE_BUFFER || !fruit.utils.canScroll(el))){
								load(el);
							}
							else{
								loading = false;
							}
						}
					});
				}
			});
		},
		newPost: function(){
			pages.writePost.loadPost();
			fruit.tabs.showTab('writepost');
		},
		editPost: function(id){
			pages.writePost.loadPost(id);
			fruit.tabs.showTab('writepost');
		},
		addPost: function(post){
			console.log('adding post');
			$('#previews').prepend(post);
			console.log('adding', post);
		},
		removePost: function(id){
			var post = posts[fruit.utils.getIndex(posts, '_id', id)];
			fruit.alert(
				'Are you sure you want to delete "' + post.title + "?", 
				['yes', 'no'],
				function(resp){
					// Yes
					if(Number(resp) === 0){
						$('#post' + id).remove();
						$.ajax({
							type: "POST",
							url: "/admin/removepost",
							data: {id: id},
							success: function(resp){
								console.log(resp);
							}
						});
					}
				}
			);
		}
	},
	newAuthor: {
		init: function(){
			fruit.events.subscribe('tabshow.newauthor', this.onShow);
		},
		show: function(){
			fruit.tabs.showTab('newauthor');
		},
		onShow: function(){
			console.log('show');
			$('#newAuthorPage input').val('');
		},
		save: function(){
			$('#alert').html('');
			var data = {
				password: $("#newAuthorPage .newPass").val(),
				name_login: $("#newAuthorPage .nameLogin").val(),
				name_display: $("#newAuthorPage .nameDisplay").val(),
				admin: false
			};
			console.log(data);
			if(!pages.newAuthor.validate(data)){
				console.log('no errors');
				$.ajax({
					type: "POST",
					url: "/admin/newauthor",
					data: data,
					success: function(resp){
						console.log(resp);
						if(resp.message){
							if(resp.message == 'success'){
								fruit.tabs.showTab('manageauthors');
								$('#authorsTable').append(resp.rendered);
							}
						else{
							$('#newAuthorPage .error').html(resp.message);
						}
						}
						else if(resp.error){
							$('#newAuthorPage .error').html(resp.error);				
						}
					}
				});
			}
		},
		validate: function(data){
			var isError = false;
			if(data.name_login.length < 1){
				$('#newAuthorPage .error').append('<div>No login name was entered<div>');
				isError = true;
			}
			else if(data.name_login.match(' ') !== null){
				$('#newAuthorPage .error').append('<div>Spaces are not allowed for login names</div>');
				isError = true;
			}
			if(data.name_display.length < 1){
				$('#newAuthorPage .error').append('<div>No display name was entered<div>');
				isError = true;
			}
			if(data.password.length < 1){
				$('#newAuthorPage .error').append('<div>No password was entered<div>');
				isError = true;
			}
			else if(data.password != $("#newAuthorPage .confirmPass").val()){
				$('#newAuthorPage .error').append('<div>Passwords do not match<div>');
				isError = true;
			}
			return isError;
		}
	}
};
