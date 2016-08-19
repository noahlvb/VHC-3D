var util = require("util");

var usersDB = require("./../../models/users");
var account = require("./../account");

module.exports = function (router, passport) {

    router.use('/prints', require('./router-front/router-prints.js'));

    // main page
    router.get('/', account.isLoggedInAsUser, function(req, res, next){
        res.set({"Content-Type": "text/html"});
        res.render('home', {
            user : {
                username : req.user.username,
                type : req.user.type,
                materialAmount: req.user.materialAmount,
                materialAmountReserved: req.user.materialAmountReserved
            }
        });
    });

    // login page
    router.get('/login', function(req, res, next) {
        res.set({"Content-Type": "text/html"});
        res.render('login', {});
    });


    // logout request
    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/login');
    });

    // account management page
    router.get('/admin/account', account.isLoggedInAsAdmin, function (req, res) {
        res.set({"Content-Type": "text/html"});
        res.render('account', {
            user : {
                username : req.user.username,
                type : req.user.type
            }
        });
    });

    // user specific profile
    router.get('/admin/account/profile/:id', account.isLoggedInAsAdmin, function (req, res) {
        usersDB.findOne({ _id : req.params.id }, function (err, document) {
            res.render('account-profile' , {
                user : {
                    username : req.user.username,
                    type : req.user.type
                },

                user_profile : {
                    id                      : document._id,
                    username                : document.username,
                    type                    : document.type,
                    date                    : document.birthday,
                    group                   : document.group,
                    monthlyMaterial         : document.monthlyMaterial,
                    materialAmount          : document.materialAmount,
                    materialAmountReserved  : document.materialAmountReserved
                }
            });
        });
    });

    // add user
    router.get('/admin/account/add', account.isLoggedInAsAdmin, function (req, res) {
        res.set({"Content-Type": "text/html"});
        res.render('account-add', {
            user : {
                username : req.user.username,
                type : req.user.type
            }
        });
    });

    router.get('/supervisor/pending', account.isLoggedInAsUser, function (req, res) {
        if(req.user.type == 'admin' || req.user.type == 'supervisor'){
            res.set({"Content-Type": "text/html"});
            res.render('supervisor-pending', {
                user : {
                    username : req.user.username,
                    type : req.user.type
                }
            });
        } else {
            req.flash('error', 'Je mag hier niet zijn!');
            res.redirect('/');
        }
    });

    // login request
    router.post('/login',
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
        })
    );
};
