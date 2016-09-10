var LocalStrategy = require('passport-local').Strategy;
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

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

    passport.use(new GoogleStrategy({
        clientID        : "393274459370-4op6s39g1g17fe71hnar0tu8mkmi7k6k.apps.googleusercontent.com",
        clientSecret    : "Qmy38_45nSJ04qH4v8ayztdJ",
        callbackURL     : "http://127.0.0.1:3000/auth/google/callback"
    }, function(token, refreshToken, profile, done){
        process.nextTick(function() {
            usersDB.findOne({ 'google.id' : profile.id }, function(err, user){
                if(err){
                    return done(err);
                }

                if(user){
                    return done(null, user);
                }else{
                    var newUser             = new usersDB();

                    newUser.google.id       = profile.id;
                    newUser.google.token    = token;
                    newUser.username        = profile.displayName;
                    newUser.type            = 'normal';
                    newUser.email           = profile.emails[0].value;

                    newUser.monthlyMaterial = 500;
                    newUser.materialAmount  = newUser.monthlyMaterial;
                    newUser.materialAmountReserved  = 0;

                    newUser.save(function(err) {
                        if(err){
                            throw err;
                        }
                        return done(null, newUser);
                    });
                }
            });
        });
    }));
};
