var express = require("express");
var util = require("util");

var account = require("./../../account");

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

module.exports = router;
