var LocalStrategy = require("passport-local").Strategy;

var usersDB = require("./../models/users");
var account = require("./account");

module.exports = function (passport) {

    // passport session setup
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        usersDB.findById(id, function (err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy(function (username, password, done) {
        process.nextTick(function(){
            usersDB.findOne({ 'username' : username }, function (err, document) {
                if(err){
                    return done(err);
                }

                if(!document){
                    return done(null, false, { message: 'Username or password is invalid!'});
                }

                var isValid = account.validPassword(password, document.password, document.salty);

                if(isValid === false){
                    return done(null, false, { message: 'Username or password is invalid!'});
                }

                return done(null, document);
            });
        });
    }));
};
