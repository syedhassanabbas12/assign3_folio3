let mysql = require('mysql');
let express = require('express');
let session = require('express-session');
let bodyParser = require('body-parser');
let path = require('path');

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: '',
	database: 'nodelogin'
});

let app = express();

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'files')))
app.use(express.static(path.join(__dirname, 'uploads')))

app.get('/css/styles.css', function (req, res) {
	res.send('css/styles.css');
	// res.end();
});

app.get('/', function (request, response) {
	response.sendFile(path.join(__dirname + '/login.html'));
});

app.get('/report', function (request, response) {
	response.sendFile(path.join(__dirname + '/report.html'));
});

app.post('/auth', function (request, response) {
	if (request.session.loggedin) {
		request.session.loggedin = false;
		response.redirect('/');
		response.end();
		return;
	}
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.post('/reset', function (request, response) {
	var username = request.body.username;
	var password = request.body.oldpass;
	var newPass = request.body.newpass;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
			if (results.length > 0) {
				var sql1 = "UPDATE `accounts` SET `password` = '" + newPass + "' WHERE `accounts`.`username` = '" + username + "'";
				connection.query(sql1, function (err, result) {
					if (err) throw err;
					console.log(result.affectedRows + " record(s) updated");
				});
				request.session.loggedin = false;
				response.redirect('/');
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		});
	} else {
		response.send(' username' + request.body.username + '\n old pass' + request.body.oldpass + '\n new pass' + request.body.newpass);
		response.end();
	}
});

app.get('/home', function (request, response) {
	if (request.session.loggedin) {
		response.sendFile(path.join(__dirname + '/home.html'));
	} else {
		response.send('Please login to view this page!');
	}
	// response.end();
});

app.post('/timein', (req, res) => {
	const timein = new Date().toString().split(' ')[4];
	const date = new Date().toLocaleDateString().split('/');
	// var sql1 = "INSERT INTO timetable(date, timein) VALUES ('" + date[2] + "-" + date[0] + "-" + date[1] + "', '" + timein + "')";
	var sql1 = "INSERT INTO timetable(date, timein) VALUES('" + date[2] + "-" + date[0] + "-" + date[1] + "', '" + timein + "') ON DUPLICATE KEY UPDATE timein = '"+timein+"'";
	connection.query(sql1, function (err, result) {
		if (err) throw err;
		console.log(result.affectedRows + " record(s) updated");
	});
});

app.post('/timeout', (req, res) => {
	const timeout = new Date().toString().split(' ')[4];
	const date = new Date().toLocaleDateString().split('/');
	var sql1 = "INSERT INTO timetable(date, timeout) VALUES ('" + date[2] + "-" + date[0] + "-" + date[1] + "', '" + timeout + "') ON DUPLICATE KEY UPDATE timeout = '"+timeout+"'";
	connection.query(sql1, function (err, result) {
		if (err) throw err;
		console.log(result.affectedRows + " record(s) updated");
	});
});

app.listen(3000);