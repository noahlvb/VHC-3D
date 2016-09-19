var util = require("util");
var CronJob = require('cron').CronJob;
var nconf = require("nconf");
var request = require("request");
var nodemailer = require("nodemailer");

var usersDB = require("./../models/users");
var printsDB = require("./../models/prints");
var settings = require("./../config/settings");

var date = new Date();
var printerFault = false;
var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: settings.mail.gmailAddr,
        pass: settings.mail.gmailAppPassword
    }
});

nconf.use('file', { file: './config/settings.json' });
nconf.load();

function startNewPrint() {
    if(printerFault !== true){
        printsDB.findOne({status: 2 }, function(err, document){
            if(document !== null){
                require("./slice")(document._id, false, function(response){
                    if(response == 0){
                        request.post({
                            url: settings.octo_addr + 'api/files/local/' + document.fileLocation.substr(-25) + '.gcode',
                            headers: {'X-Api-Key': settings.octo_key},
                            json: {
                                "command": "select",
                                "print": true
                            }
                        }, function(err, response, body){
                            if(response.statusCode === 204){
                                document.status = 3;
                                document.save();

                                usersDB.findOne({_id: document.owner}, function(err, documentUser){
                                    documentUser.materialAmountReserved = documentUser.materialAmountReserved - document.materialAmount;
                                    documentUser.save();
                                });
                            }else if(response.statusCode === 409){
                                setTimeout(function(){
                                    request.delete({
                                        url: settings.octo_addr + 'api/files/local/' + document.fileLocation.substr(-25) + '.gcode',
                                        headers: {'X-Api-Key': settings.octo_key}
                                    }, function(err, response, body){
                                        if (err) return logger.error(err);
                                    });
                                }, 5000);
                            }
                        });
                    }
                });
            }
        });
    }
}

new CronJob('01 */5 * 1 * *', function() {
    if(nconf.get('lastRenewel') !== String((date.getMonth()+1) + '-' + date.getFullYear())){
        usersDB.find().stream()
        .on('data', function(user){
            user.materialAmount = user.monthlyMaterial;
            user.save();
        })
        .on('error', function(err){
            return logger.error(err);
        })
        .on('end', function(){
            nconf.set('lastRenewel', String((date.getMonth()+1) + '-' + date.getFullYear()));
            nconf.save(function(err){
                if (err) return logger.error(err);
            });
        });
    }
}, null, true, 'Europe/Amsterdam');

new CronJob('01 */1 * * * *', function() {
    request.get({
        url: settings.octo_addr + 'api/printer?exclude=temperature,sd/',
        headers: {'X-Api-Key': settings.octo_key},
        json: true
    }, function(err, responsePrinter, bodyPrinter){
        if (err) return logger.error(err);

        if(responsePrinter.statusCode === 200){
            request.get({
                url: settings.octo_addr + 'api/job',
                headers: {'X-Api-Key': settings.octo_key},
                json: true
            }, function(err, responseJob, bodyJob){
                if(bodyJob.job.file.name !== null){
                    var jobFile = 'files/slt/' + bodyJob.job.file.name.slice(0, -6);
                }

                if(bodyPrinter.state.flags.closedOnError === true || bodyPrinter.state.flags.error === true){
                    printsDB.findOne({fileLocation: jobFile}, function(err, document){
                        document.status = 41;
                        document.save();
                    });
                    printerFault = true;

                    smtpTransport.sendMail({
                        from: settings.mail.gmailAddr,
                        to: settings.mail.sysadmin,
                        subject: 'VHC3D: printerFault!!!',
                        text: 'A print job failed and the system needs your attention!!!'
                    }, function(err, response){
                        if(err){
                            logger.error(err);
                        }
                    });

                    usersDB.findOne({_id: document.owner}, function(err, documentUser){
                        smtpTransport.sendMail({
                            from: settings.mail.gmailAddr,
                            to: documentUser.email,
                            subject: 'VHC3D: Print opdracht mislukt',
                            html: '<h4>Hallo ' + documentUser.username + '</h4><br><p>Je print opdracht ' + document.name + ' is mislukt en is niet geprint of niet goedgeprint.<br>Je kunt de overblijfselen komen ophalen als je dat wilt.<br><br>Vriendlijke groet VHC 3d print Team</p>'
                        }, function(err, response){
                            if(err){
                                logger.error(err);
                            }
                        });
                    });

                    request.post({
                        url: settings.octo_addr + 'api/job',
                        headers: {'X-Api-Key': settings.octo_key},
                        json: cancelRawBody = {
                            "command": "cancel"
                        }
                    }, function(err, responseCancel, bodyCancel){

                    });

                }else if(bodyPrinter.state.flags.operational === true || bodyPrinter.state.flags.ready === true || bodyPrinter.state.flags.printing === false){
                    if(bodyJob.progress.completion === null){
                        startNewPrint();
                    }else if(bodyJob.progress.completion == 100){
                        printsDB.findOne({fileLocation: jobFile}, function(err, document){
                            document.status = 4;
                            document.save();

                            usersDB.findOne({_id: document.owner}, function(err, documentUser){
                                smtpTransport.sendMail({
                                    from: settings.mail.gmailAddr,
                                    to: documentUser.email,
                                    subject: 'VHC3D: Print opdracht voltooid',
                                    html: '<h4>Hallo ' + documentUser.username + '</h4><br><p>Je print opdracht ' + document.name + ' is voltooid.<br>Je kunt de het project komen ophalen.<br><br>Vriendlijke groet VHC 3d print Team</p>'
                                }, function(err, response){
                                    if(err){
                                        logger.error(err);
                                    }
                                });
                            });

                            request.post({
                                url: settings.octo_addr + 'api/job',
                                headers: {'X-Api-Key': settings.octo_key},
                                json: cancelRawBody = {
                                    "command": "cancel"
                                }
                            }, function(err, responseCancel, bodyCancel){

                            });

                            startNewPrint();
                        });
                    }
                }
            });
        }
    });

    if(printerFault === true){
        logger.info("------ Printer Fault!!!!!!! -------");
    }
}, null, true, 'Europe/Amsterdam');
