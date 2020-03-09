const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const api = require('./api');

const app = express();

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.use('/assets', express.static('assets'));
app.use('/api', api);

//////////  ROUTES  //////////
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/login.html');
})

app.get('/attendance', function (req, res) {
    if (!req.session.loggedin) {
        res.send("Please login to view this page...");
        res.end();
        return;
    }
    res.render('attendance', {
        username: req.session.user.name
    });
});

app.get('/view-report', (req, res) => {
    let list = req.session.timetable;
    for (let i = 0; i < list.length; i++) {
        let d = new Date(list[i].date).toDateString();
        list[i].date = d;
    }
    let time1 = new Date();
    let time2 = new Date();
    let splitTimein = list[0].timein.split(":");
    let splitTimeout = list[0].timeout.split(":");
    time1.setHours(splitTimein[0], splitTimein[1], splitTimein[2], 0);
    time2.setHours(splitTimeout[0], splitTimeout[1], splitTimeout[2], 0);

    let diff = time2.getTime() - time1.getTime();
    let msec = diff;
    let hh = `0${Math.floor(msec / 1000 / 60 / 60)}`;
    msec -= hh * 1000 * 60 * 60;
    let mm = `0${Math.floor(msec / 1000 / 60)}`;
    msec -= mm * 1000 * 60;
    let ss = `0${Math.floor(msec / 1000)}`;
    msec -= ss * 1000;
    let timeStr = hh.slice(-2) + ":" + mm.slice(-2) + ":" + ss.slice(-2);

    res.render('view-report', {
        timetable: list,
        user: req.session.user.name,
        dates: [list[0].date, list[list.length - 1].date]
    });
})

app.get('/mark-missing', (req, res) => {
    let list = req.session.missinglist;
    console.log("DB RESULT: ", list);
    for (let i = 0; i < list.length; i++) {
        let d = new Date(list[i].date).toDateString();
        list[i].dateString = d;
    }
    console.log("MANIPULATION: ", list);

    res.render('mark-missing', {
        missinglist: list,
        user: req.session.user.name
    });
})

app.post('/change-password', (req, res) => {
    res.render('change-password', {
        username: req.session.user.name
    })
})

app.listen(3000);