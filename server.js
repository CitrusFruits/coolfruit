var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
var publicRoute = require('./routes/public.js');
var adminRoute = require('./routes/admin.js');
var apiRoute = require('./routes/api.js');

// Set up the database
require('./database.js');

var app = express();
var port = process.env.port || 3000;

/*app.get('/', function(req, res){
	res.send('this is working');
});*/


app.set('view engine', 'jade');
app.use('/admin/', adminRoute(express));
app.use('/api/', apiRoute(express));
app.use('/static/', express.static(__dirname + '/static'));
app.use('/', publicRoute(express));

app.use(bodyParser.urlencoded({ extended: false }));

app.listen(port);