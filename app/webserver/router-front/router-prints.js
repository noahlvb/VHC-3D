var express = require("express");
var util = require("util");

var account = require("./../../account");
var printsDB = require("./../../../models/prints");

var router = express.Router();

router.get('/add', account.isLoggedInAsUser, function(req, res){
    res.set({"Content-Type": "text/html"});
    res.render('prints-add', {
        user : {
            username : req.user.username,
            type : req.user.type
        }
    });
});

router.get('/archived', account.isLoggedInAsUser, function(req, res){
    res.set({"Content-Type": "text/html"});
    res.render('prints-archived', {
        user : {
            username : req.user.username,
            type : req.user.type
        }
    });
});

router.get('/:id', account.isLoggedInAsUser, function(req, res){
    printsDB.findOne({_id: req.params.id}, function(err, document){
        res.set({"Content-Type": "text/html"});
        if(req.user.type == "admin" || req.user.type == "supervisor" || req.user._id == document.owner){
            res.render('prints-item', {
                user : {
                    username : req.user.username,
                    type : req.user.type
                },
                print : document
            });
        }else{
            req.flash('error', 'U hebt geen permissie om deze print opdracht te bekijken');
            res.redirect('/');
        }
    });
});

router.get('/download/:id', account.isLoggedInAsUser, function(req, res){
    printsDB.findOne({_id: req.params.id}, function(err, document){
        if(req.user.type == "admin" || req.user.type == "supervisor" || req.user._id == document.owner){
            res.download('./' + document.fileLocation, function(err){
                if (err) {
                    console.log(err);
                }
            });
        }else{
            req.flash('error', 'U hebt geen permissie om deze bestand te bekijken');
            res.redirect('/');
        }
    });
});

module.exports = router;
