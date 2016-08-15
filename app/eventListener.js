var util = require("util");
var CronJob = require('cron').CronJob;
var nconf = require("nconf");

var usersDB = require("./../models/users");
var date = new Date();

nconf.use('file', { file: './config/settings.json' });
nconf.load();

new CronJob('01 */5 * 1 * *', function() {
    if(nconf.get('lastRenewel') !== String((date.getMonth()+1) + '-' + date.getFullYear())){
        usersDB.find().stream()
        .on('data', function(user){
            user.materialAmount = user.monthlyMaterial;
            user.save();
        })
        .on('error', function(err){
            return console.error(err);
        })
        .on('end', function(){
            nconf.set('lastRenewel', String((date.getMonth()+1) + '-' + date.getFullYear()));
            nconf.save(function(err){
                if (err) return console.error(err);
            });
        });
    }
}, null, true, 'Europe/Amsterdam');
