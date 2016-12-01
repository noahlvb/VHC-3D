var async = require("async");
var request = require("request");

var usersDB = require("./../../models/users");
var printsDB = require("./../../models/prints");
var account = require("./../account");
var settings = require("./../../config/settings");

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

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

    router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'], hd : settings.googleOauth.hd }));

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
                    email                   : document.email,
                    type                    : document.type,
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

    router.get('/dashboard', account.isLoggedInAsUser, function(req, res) {
        if(req.user.type == 'admin' || req.user.type == 'supervisor'){
            async.waterfall([
                function(callback){
                    printsDB.findOne({ status: 3 }, function(err, documentPrint){
                        callback(null, documentPrint);
                    });
                },
                function(documentPrint, callback){
                    if(documentPrint){
                        usersDB.findOne({_id: documentPrint.owner}, function(err, documentUser){
                            callback(null, documentPrint, documentUser);
                        });
                    }else{
                        callback('noPrint');
                    }
                },
                function(documentPrint, documentUser, callback){
                    request.get({
                        url: settings.octo_addr + 'api/job',
                        headers: {'X-Api-Key': settings.octo_key},
                        json: true
                    }, function(err, response, body){
                        if (err) logger.error(err);
                        callback(null, documentPrint, documentUser, body);
                    });
                }
            ], function(err, documentPrint, documentUser, body){
                renderData = {
                    user : {
                        username : req.user.username,
                        type : req.user.type
                    },
                    print : null,
                    printOwner: null,
                    progress : null,
                };

                if(err != 'noPrint'){
                    renderData.print = documentPrint;
                    renderData.printOwner = documentUser.username;
                }else if(err == 'noPrint'){

                }else if(err){
                    return logger.error(err);
                }

                if(body && body.progress.completion != null){
                    renderData.progress = body.progress.completion.toFixedDown(2);
                }

                res.render('dashboard', renderData);
            });
        }else{
            req.flash('error', 'Je mag hier niet zijn!');
            res.redirect('/');
        }
    });

    // login request
    router.post('/auth/local',
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true,
        })
    );

    router.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/',
            failureRedirect: '/login',
            failureFlash: true
        })
    );
};
