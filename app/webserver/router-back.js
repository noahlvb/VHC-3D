var express = require("express");
var nconf = require("nconf");

var account = require("./../account");

nconf.use('file', { file: './config/settings.json' });
nconf.load();

var router = express.Router();

router.use('/account', require('./router-back/router-account.js'));
router.use('/prints', require('./router-back/router-prints.js'));

router.get('/printer/toggle', account.isLoggedInAsUser, function(req, res){
    if(req.user.type == 'admin' || req.user.type == 'supervisor'){
        if(nconf.get('printerFault') === false){
            nconf.set('printerFault', true);
        }else{
            nconf.set('printerFault', false);
        }
        nconf.save(function(err){
            if (err) return logger.error(err);
        });
        res.redirect('/dashboard');
    }else{
        req.flash('error', 'Je mag hier niet zijn!');
        res.redirect('/');
    }
});

module.exports = router;
