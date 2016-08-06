// loading required libaries
var http            = require("http"),
    util            = require("util"),
    ejs             = require("ejs"),
    ejsLayouts      = require("express-ejs-layouts"),
    express         = require("express"),
    bodyParser      = require("body-parser"),
    cookieParser    = require("cookie-parser"),
    expressSession  = require("express-session"),
    Flash           = require("express-flash"),
    connectMongo    = require("connect-mongo")(expressSession),
    passport        = require("passport");

// loading Auth system and settings
var settings = require("./config/settings");
require("./app/passport")(passport, settings);

//setting-up webserver
var router = express();
var server = http.createServer(router);

    router.set('view engine', 'ejs');
    router.set('views', __dirname + '/views');
    router.use('/static', express.static(__dirname + '/public'));
    router.set('view cache', false);
    router.use(ejsLayouts);

    router.use(cookieParser(settings.secret));
    router.use(bodyParser.urlencoded({ extended: false }));
    router.use(bodyParser.json());
    router.use(expressSession({
        secret : process.env.SESSION_SECRET || settings.secret,
        key : 'connect.sid',
        store : new connectMongo({url: settings.db}),
        resave : false,
        saveUninitialized : false
    }));
    router.use(Flash());

    // initializing passport
    router.use(passport.initialize());
    router.use(passport.session());

router.use(function (err, req, res, next) {
    res.status(500).render('error/500');
});

// defining routes
router.use('/backend', require('./app/webserver/router-back.js'));
require("./app/webserver/router-front.js")(router, passport);

router.use(function(req, res) {
    res.status(404).render('error/404', { page_url : req.hostname + req.path});
});

module.exports = server;