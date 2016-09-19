var winston = require("winston");
var fs = require("fs");

if (!fs.existsSync('./logs')){
    fs.mkdirSync('./logs');
}

winston.emitErrs = true;
var logger = new winston.Logger({
    transports: [
        new winston.transports.File({
            level: 'info',
            filename: './logs/log.log',
            handleExceptions: true,
            json: true,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            json: false,
            colorize: true,
            timestamp: true
        })
    ],
    exitOnError: false
});

var loggerExpress = new winston.Logger({
    transports: [
        new winston.transports.File({
            name: 'express',
            level: 'info',
            filename: './logs/express.log',
            handleExceptions: true,
            json: true,
            colorize: false
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.streamExpress = {
    write: function(message, encoding){
        loggerExpress.info(message);
    }
};
