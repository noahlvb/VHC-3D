var CronJob = require('cron').CronJob;
var nconf = require("nconf");
var request = require("request");
var nodemailer = require("nodemailer");
var async = require("async");
var nodeStl = require("node-stl");

var usersDB = require("./../models/users");
var printsDB = require("./../models/prints");
var settings = require("./../config/settings");

var date = new Date();
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
    if(nconf.get('printerFault') !== true){
        printsDB.find({}).sort({'updatedAt': 1, 'priority': -1}).findOne({status: 2 }, function(err, document){
            if(document !== null){
                require("./slice")(document._id, false, function(response){
                    if(response == 0){
                        request.post({
                            url: settings.octo_addr + 'api/files/local/' + document.fileLocation.substr(-25) + document.randomIdentifier + '.gcode',
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
                                    documentUser.materialAmountReserved = Math.max(0, documentUser.materialAmountReserved - document.materialAmount);
                                    documentUser.save();
                                });
                            }else if(response.statusCode === 409){
                                setTimeout(function(){
                                    request.delete({
                                        url: settings.octo_addr + 'api/files/local/' + document.fileLocation.substr(-25) + document.randomIdentifier + '.gcode',
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
    async.waterfall([
        function(callback){
            request.get({
                url: settings.octo_addr + 'api/printer?exclude=temperature,sd/',
                headers: {'X-Api-Key': settings.octo_key},
                json: true
            }, function(err, responsePrinter, bodyPrinter){
                if (err) callback(err);
                callback(null, responsePrinter, bodyPrinter);
            });
        },
        function(responsePrinter, bodyPrinter, callback){
            if(responsePrinter && responsePrinter.statusCode === 200){
                request.get({
                    url: settings.octo_addr + 'api/job',
                    headers: {'X-Api-Key': settings.octo_key},
                    json: true
                }, function(err, responseJob, bodyJob){
                    if (err) callback(err);
                    callback(null, responsePrinter, bodyPrinter, responseJob, bodyJob);
                });
            }else{
                callback('noConnection');
            }
        }
    ],function(err, responsePrinter, bodyPrinter, responseJob, bodyJob){
        if(err == 'noConnection'){
            return;
        }else if(err){
            return logger.error(err);
        }

        if(bodyJob.job.file.name !== null){
            var jobFile = 'files/stl/' + bodyJob.job.file.name.slice(0, -12);
        }

        if(bodyPrinter.state.flags.closedOnError === true || bodyPrinter.state.flags.error === true){
            printsDB.findOne({fileLocation: jobFile}, function(err, document){
                document.status = 41;
                document.save();
            });
            nconf.set('printerFault', true);
            nconf.save(function(err){
                if (err) return logger.error(err);
            });

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
                json: {
                    "command": "cancel"
                }
            }, function(err, responseCancel, bodyCancel){

            });

        }else if(bodyPrinter.state.flags.operational === true && bodyPrinter.state.flags.ready === true && bodyPrinter.state.flags.printing === false && bodyJob.progress.completion == 100){
            printsDB.findOne({fileLocation: jobFile}, function(err, document){
                if(document.finished === false && document.status != 4){
                    document.status = 4;
                    document.save();

                    var stl = nodeStl('./' + document.fileLocation);
                    var requiredBedHeight = Math.max(1, stl.boundingBox[2] - 45);

                    request.post({
                        url: settings.octo_addr + 'api/printer/command',
                        headers: {'X-Api-Key': settings.octo_key},
                        json: {
                            "commands": [
                                "G90",
                                "G1 Z197",
                                "M104 S0",
                                "M140 S0"
                            ]
                        }
                    }, function(err, responsePushOff, bodyPushOff){
                        var checkForTemp = setInterval(function(){
                            request.get({
                                url: settings.octo_addr + 'api/printer?history=false',
                                headers: {'X-Api-Key': settings.octo_key},
                                json: true
                            }, function(err, responseTemp, bodyTemp){
                                if (err) return logger.error(err);
                                if(bodyTemp.temperature.bed.actual <= 22.5){
                                    clearInterval(checkForTemp);
                                    request.post({
                                        url: settings.octo_addr + 'api/printer/command',
                                        headers: {'X-Api-Key': settings.octo_key},
                                        json: {
                                            "commands": [
                                                "G1 Y200",
                                                "G1 X97.5",
                                                String("G1 Z" + requiredBedHeight),
                                                "G1 Y0 F7000",
                                                "G4 P1000",
                                                "M140",
                                                "G28",
                                                "G1 Z100"
                                            ]
                                        }
                                    }, function(err, responsePushOff, bodyPushOff){
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

                                        if(responsePushOff.statusCode == 204){
                                            document.finished = true;
                                            document.save();
                                            startNewPrint();
                                        }
                                    });
                                }
                            });
                        }, 20000);
                    });
                }else if(document.finished === true && document.status == 4){
                    startNewPrint();
                }
            });
        }else if(bodyPrinter.state.flags.operational === true && bodyPrinter.state.flags.ready === true && bodyPrinter.state.flags.printing === false && bodyJob.progress.completion == null || bodyJob.progress.completion == 0){
            startNewPrint();
        }
    });
}, null, true, 'Europe/Amsterdam');
