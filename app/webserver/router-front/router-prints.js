var express = require("express");
var request = require("request");

var account = require("./../../account");
var printsDB = require("./../../../models/prints");
var settings = require("./../../../config/settings");

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

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
            request.get({
                url: settings.octo_addr + 'api/job',
                headers: {'X-Api-Key': settings.octo_key},
                json: true
            }, function(err, response, body){
                if (err) logger.error(err);
                if (body && body.progress.completion != null){
                    res.render('prints-item', {
                        user : {
                            username : req.user.username,
                            type : req.user.type
                        },
                        print : document,
                        progress : body.progress.completion.toFixedDown(2)
                    });
                }else{
                    res.render('prints-item', {
                        user : {
                            username : req.user.username,
                            type : req.user.type
                        },
                        print : document,
                        progress : 0
                    });
                }
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
                    logger.info(err);
                }
            });
        }else{
            req.flash('error', 'U hebt geen permissie om deze bestand te bekijken');
            res.redirect('/');
        }
    });
});

module.exports = router;
