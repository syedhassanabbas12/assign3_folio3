const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
let userDetails;
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nodelogin',
    multipleStatements: true,
})

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('mysql connected...')
})
// app.use(express.urlencoded());
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


let auth = app.post('/auth', (req, res) => {
    if (req.session.loggedin) {
        req.session.loggedin = false;
        res.redirect('/');
        res.end();
        return;
    }
    var username = req.body.username;
    var password = req.body.password;
    if (username && password) {
        db.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            if (results.length > 0) {
                req.session.user = results[0];
                userDetails = results[0];
                req.session.loggedin = true;
                req.session.username = username;
                res.redirect('/attendance');
            } else {
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    } else {
        res.send('Please enter Username and Password!');
        res.end();
    }
})

let reset = app.post('/reset', function (req, res) {
    var username = req.session.username;
    var password = req.body.oldpassword;
    var newPass = req.body.newpassword;
    if (username && password) {
        db.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function (error, results, fields) {
            if (results.length > 0) {
                var sql1 = "UPDATE `accounts` SET `password` = '" + newPass + "' WHERE `accounts`.`username` = '" + username + "' AND `accounts`.`password` = '" + password + "'";
                db.query(sql1, function (err, result) {
                    if (err) throw err;
                });
                req.session.loggedin = false;
                res.redirect('/');
            } else {
                res.send('Incorrect Username and/or Password!');
            }
            res.end();
        });
    } else {
        res.send(' username' + req.body.username + '\n old pass' + req.body.oldpass + '\n new pass' + req.body.newpass);
        res.end();
    }
});

let timein = app.post('/timein', (req, res) => {
    const timein = new Date().toString().split(' ')[4];
    const date = new Date().toLocaleDateString().split('/');
    var sql1 = "INSERT INTO timetable(date, timein) VALUES('" + date[2] + "-" + date[0] + "-" + date[1] + "', '" + timein + "') ON DUPLICATE KEY UPDATE timein = '" + timein + "'";
    db.query(sql1, function (err, result) {
        if (err) throw err;
    });
});

let timeout = app.post('/timeout', (req, res) => {
    const timeout = new Date().toString().split(' ')[4];
    const date = new Date().toLocaleDateString().split('/');
    var sql1 = "INSERT INTO timetable(date, timeout) VALUES ('" + date[2] + "-" + date[0] + "-" + date[1] + "', '" + timeout + "') ON DUPLICATE KEY UPDATE timeout = '" + timeout + "'";
    db.query(sql1, function (err, result) {
        if (err) throw err;
    });
});

let gettime = app.get('/get-time', (req, res) => {
    const date = new Date().toLocaleDateString().split('/');
    var sql1 = "SELECT timein, timeout FROM timetable WHERE date='" + date[2] + "-" + date[0] + "-" + date[1] + "'";
    db.query(sql1, function (err, result) {
        if (err) throw err;
        res.send(result[0]);
    });
})

let fetchreport = app.post('/get-report', (req, res) => {
    let from = req.body.from;
    let till = req.body.till;

    var sql = "SELECT * FROM `timetable` WHERE `date` BETWEEN '" + from + "' AND '" + till + "'";
    db.query(sql, function (err, result) {
        if (err) throw err;
        req.session.timetable = result;
        res.redirect('/view-report');
    });
});

let markmissing = app.post('/mark-missing', (req, res) => {
    let from = req.body.from2;
    let till = req.body.till2;
    var sql = "SELECT * FROM `timetable` WHERE `date` BETWEEN '" + from + "' AND '" + till + "'";
    db.query(sql, function (err, result) {
        if (err) throw err;
        req.session.missinglist = result;
        req.session.user = userDetails;
        res.redirect('/mark-missing');
    });
});

let updatemissing = app.post('/update-missing', (req, res) => {
    let queries = '';
    req.body.list.forEach(function (item) {
        queries += mysql.format("UPDATE timetable SET timein = ?, timeout = ? WHERE date = ?; ", [item.timein, item.timeout, item.date]);
    });

    console.log("MY QUERY: ", queries);
    db.query(queries, function(err, result){
        if(err) throw err;
        console.log("RESULT: ", result);
        res.redirect('/attendance');
        // res.render('attendance', {
        //     username: req.session.user.name
        // });
    });
});

module.exports = app;