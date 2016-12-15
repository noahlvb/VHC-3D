#!/usr/bin/env node
require('@risingstack/trace');
var mongoose = require("mongoose");
var fs = require("fs");
var path = require("path");

var dir = ['./files', './files/stl', './files/tmp'];
var configFiles = fs.readdirSync('./config');

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

dir.forEach(function(element){
    if(!fs.existsSync(element)){
        fs.mkdirSync(element);
    }
});

configFiles.forEach(function(element){
    if(path.extname(element) === ".default"){
        if(!fs.existsSync('./config/' + element.slice(0, -8))){
            fs.createReadStream('./config/' + element).pipe(fs.createWriteStream('./config/' + element.slice(0, -8)));
        }
    }
});
setTimeout(function(){
    var server = require('./app');
    var settings = require("./config/settings");
    logger = require('./app/logger');
    cwd = __dirname;

    mongoose.connect(settings.db, {auto_reconnect: true});
    mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
    mongoose.connection.once('open', function callback () {
        logger.info('connected! DB: ' + settings.db);

        var app = server.listen(process.env.PORT || settings.web_port, process.env.IP || settings.web_ip, function(){
            logger.info("webserver listening at " + server.address().address + ":" + server.address().port);
            require("./app/eventListener");
            require("./app/account");
        });
    });

}, 1000);
