#!/usr/bin/env node
var server = require('../app');
var settings = require("../config/settings");
logger = require('./../app/logger');

var mongoose = require("mongoose");
var util = require("util");

mongoose.connect(settings.db, {auto_reconnect: true});
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', function callback () {
    logger.info('connected! DB: ' + settings.db);

    var app = server.listen(process.env.PORT || settings.web_port, process.env.IP || settings.web_ip, function(){
        logger.info("webserver listening at " + server.address().address + ":" + server.address().port);
        require("../app/eventListener");
    });
});
