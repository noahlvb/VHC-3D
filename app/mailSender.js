var nodemailer = require("nodemailer");
var ejs = require("ejs");

var settings = require("./../config/settings");

var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: settings.mail.gmailAddr,
        pass: settings.mail.gmailAppPassword
    }
});

module.exports = function(to, subject, template, data, callback){
    ejs.renderFile(cwd + '/views/email/' + template + '.ejs', data, function(err, html){
        if(err){
            callback(err);
        }

        smtpTransport.sendMail({
            from: settings.mail.gmailAddr,
            to: to,
            subject: subject,
            html: html
        }, function(err, response){
            if(err){
                callback(err);
            }
            callback(null, response);
        });
    });
};
