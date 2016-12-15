var express = require("express");
var fs = require("fs");
var request = require("request");
var nodemailer = require("nodemailer");
var nconf = require("nconf");

var printsDB = require("./../../../models/prints");
var usersDB = require("./../../../models/users");
var account = require("./../../account");
var settings = require("./../../../config/settings");

var smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: settings.mail.gmailAddr,
        pass: settings.mail.gmailAppPassword
    }
});

nconf.use('file', { file: './config/settings.json' });
nconf.load();

var router = express.Router();

router.post('/add', account.isLoggedInAsUser, function(req, res){
    if(req.body.name == false || req.file == undefined || req.body.P_layerHeight == false || req.body.P_shellThickness == false || req.body.P_bottomTopThickness == false || req.body.P_fillDensity == false || req.body.P_printSpeed == false){
        req.flash('error', 'niet alle velden zijn ingevuld');
        res.redirect('/prints/add');
        return;
    }

    if(req.body.P_support != 0 && req.body.P_support != 1 && req.body.P_support != 2){
        req.flash('error', 'a niet alle velden zijn ingevuld');
        res.redirect('/prints/add');
        return;
    }
    if(req.body.P_platformAdhesionType != 0 && req.body.P_platformAdhesionType != 1 && req.body.P_platformAdhesionType != 2){
        req.flash('error', 'niet alle velden zijn ingevuld');
        res.redirect('/prints/add');
        return;
    }

    var originalName = String(req.file.originalname);
    var fileExtension = originalName.split(".")[1];
    if(fileExtension.toLowerCase() != 'stl'){
        req.flash('error', 'Geuploade bestand is geen STL bestand');
        res.redirect('/prints/add');
        return;
    }

    data = {
        name: req.body.name,
        fileLocation: 'files/stl/' + req.file.filename + '.stl',
        owner: req.user._id,
        status: 0,
        finished: false,
        archive: false,
        estimatedPrintTime: 0,
        materialAmount: 0,

        P_layerHeight: req.body.P_layerHeight,
        P_shellThickness: req.body.P_shellThickness,
        P_bottomTopThickness: req.body.P_bottomTopThickness,
        P_fillDensity: req.body.P_fillDensity,
        P_printSpeed: req.body.P_printSpeed,
        P_support: req.body.P_support,
        P_platformAdhesionType: req.body.P_platformAdhesionType
    };

    fs.rename(cwd + '/' + req.file.path, cwd + '/files/stl/' + req.file.filename + '.stl', function(err){
        if(err){
            logger.error(err);
            req.flash('error', 'Uploaden mislukt');
            res.redirect('/prints/add');
            return;
        };

        new printsDB(data).save(function(err, data){
            if(err){
                req.flash('error', 'An error occurred');
                res.redirect('/prints/add');
                return;
            }

            require("./../../slice")(data._id, true, function(response){
                if(response == 1){
                    data.remove(function(err){
                        if (err) logger.error(err);
                    });
                    req.flash('warning', 'je hebt niet meer genoeg materiaal tot je beschikking');
                    res.redirect('/prints/add');
                }else if(response == 2){
                    data.remove(function(err){
                        if (err) logger.error(err);
                    });
                    req.flash('error', 'De verbinding met de printer is verbroken!!');
                    res.redirect('/');
                }else if(response == 3){
                    data.remove(function(err){
                        if (err) logger.error(err);
                    });
                    req.flash('error', 'Je model is groter dan X=177; Y=177; Z=185 en dat past niet in de printer!');
                    res.redirect('/');
                }else{
                    req.flash('info', 'Je printje is succesvol geupload');
                    res.redirect('/');
                }
            });
        });
    });
});

router.post('/reslice/:id/', account.isLoggedInAsUser, function(req, res){
    if(req.body.P_layerHeight == false || req.body.P_shellThickness == false || req.body.P_bottomTopThickness == false || req.body.P_fillDensity == false || req.body.P_printSpeed == false){
        req.flash('error', 'niet alle velden zijn ingevuld');
        res.redirect('/prints/' + req.params.id);
        return;
    }
    if(req.body.P_support != 0 && req.body.P_support != 1 && req.body.P_support != 2){
        req.flash('error', 'niet alle velden zijn ingevuld');
        res.redirect('/prints/' + req.params.id);
        return;
    }
    if(req.body.P_platformAdhesionType != 0 && req.body.P_platformAdhesionType != 1 && req.body.P_platformAdhesionType != 2){
        req.flash('error', 'niet alle velden zijn ingevuld');
        res.redirect('/prints/' + req.params.id);
        return;
    }

    printsDB.findOne({_id: req.params.id}, function(err, document){
        var oldDocument = document;
        if(document.owner == req.user._id || req.user.type == 'supervisor' || req.user.type == 'admin'){
            document.P_layerHeight = req.body.P_layerHeight;
            document.P_shellThickness = req.body.P_shellThickness;
            document.P_bottomTopThickness = req.body.P_bottomTopThickness;
            document.P_fillDensity = req.body.P_fillDensity;
            document.P_printSpeed = req.body.P_printSpeed;
            document.P_support = req.body.P_support;
            document.P_platformAdhesionType = req.body.P_platformAdhesionType;
            document.save(function(err){
                require("./../../slice")(document._id, true, function(response){
                    if(response == 1){
                        document = oldDocument;
                        document.save();

                        req.flash('warning', 'je hebt niet meer genoeg materiaal tot je beschikking');
                        res.redirect('/prints/' + document._id);
                    }else if(response == 2){
                        document = oldDocument;
                        document.save();

                        req.flash('error', 'De verbinding met de printer is verbroken!!');
                        res.redirect('/prints/' + document._id);
                    }else{
                        if(document.status == 21 || document.status == 41){
                            document.status = 0;
                            document.save();
                        }

                        req.flash('info', 'Je printje is succesvol gehersliced');
                        res.redirect('/prints/' + document._id);
                    }
                });
            });
        }else{
            req.flash('error', 'Je hoort niets met dit project te doen!');
            res.redirect('/');
        }
    });
});

router.get('/list/pending/', account.isLoggedInAsUser, function(req, res){
    if(req.user.type == 'supervisor' || req.user.type == 'admin'){
        printsDB.find({
            $and: [
                {status: 1},
                {archive: false}
            ]
        }, function(err, result){
            if (err) return logger.error(err);

            var printsMap = {};

            for (var i = 0; i < result.length; i++ ) {
                var individualPrint = {};
                individualPrint["id"]                    = result[i]._id;
                individualPrint["name"]                  = result[i].name;
                individualPrint["estimatedPrintTime"]    = result[i].estimatedPrintTime;
                individualPrint["materialAmount"]        = result[i].materialAmount;
                individualPrint["rejectingNotice"]       = result[i].rejectingNotice;
                printsMap[i] = individualPrint;
            }

            res.json(printsMap);
        });
    }
});

router.get('/list/waiting/', account.isLoggedInAsUser, function(req, res){
    if(req.user.type == 'supervisor' || req.user.type == 'admin'){
        printsDB.find({}).sort({'updatedAt': 1, 'priority': -1}).find({status: 2}, function(err, result){
            if (err) return logger.error(err);

            var printsMap = {};

            for (var i = 0; i < result.length; i++ ) {
                var individualPrint = {};
                individualPrint["id"]                    = result[i]._id;
                individualPrint["name"]                  = result[i].name;
                individualPrint["estimatedPrintTime"]    = result[i].estimatedPrintTime;
                individualPrint["materialAmount"]        = result[i].materialAmount;
                individualPrint["rejectingNotice"]       = result[i].rejectingNotice;
                printsMap[i] = individualPrint;
            }

            res.json(printsMap);
        });
    }
});

router.get('/list/archived/', account.isLoggedInAsUser, function(req, res){
    printsDB.find({
        $and: [
            {owner: req.user._id},
            {archive: true}
        ]
    }, function(err, result){
        if (err) return logger.error(err);

        var printsMap = {};

        for (var i = 0; i < result.length; i++ ) {
            var individualPrint = {};
            individualPrint["id"]                    = result[i]._id;
            individualPrint["name"]                  = result[i].name;
            individualPrint["status"]                = result[i].status;
            individualPrint["estimatedPrintTime"]    = result[i].estimatedPrintTime;
            individualPrint["materialAmount"]        = result[i].materialAmount;
            printsMap[i] = individualPrint;
        }

        res.json(printsMap);
    });
});

router.get('/list/:status/', account.isLoggedInAsUser, function(req, res){
    printsDB.find({
        $and: [
            {owner: req.user._id},
            {status: req.params.status},
            {archive: false}
        ]
    }, function(err, result){
        if (err) return logger.error(err);

        var printsMap = {};

        for (var i = 0; i < result.length; i++ ) {
            var individualPrint = {};
            individualPrint["id"]                    = result[i]._id;
            individualPrint["name"]                  = result[i].name;
            individualPrint["estimatedPrintTime"]    = result[i].estimatedPrintTime;
            individualPrint["materialAmount"]        = result[i].materialAmount;
            individualPrint["rejectingNotice"]       = result[i].rejectingNotice;
            printsMap[i] = individualPrint;
        }

        res.json(printsMap);
    });
});

router.get('/list/', account.isLoggedInAsUser, function(req, res){
    printsDB.find({
        $and: [
            {owner: req.user._id},
            {$or: [{status: 1}, {status: 2}, {status: 3}, {status: 4}]},
            {archive: false}
        ]
    }, function(err, result){
        if (err) return logger.error(err);

        var printsMap = {};

        for (var i = 0; i < result.length; i++ ) {
            var individualPrint = {};
            individualPrint["id"]                    = result[i]._id;
            individualPrint["name"]                  = result[i].name;
            individualPrint["status"]                = result[i].status;
            individualPrint["estimatedPrintTime"]    = result[i].estimatedPrintTime;
            individualPrint["materialAmount"]        = result[i].materialAmount;
            printsMap[i] = individualPrint;
        }

        res.json(printsMap);
    });
});

router.get('/:id/archive', account.isLoggedInAsUser, function(req, res){
    printsDB.findOne({
        $and: [
            {_id: req.params.id},
            {owner: req.user._id}
        ]
    }, function(err, document){
        if(document === null ){
            req.flash('error', 'Je bent niet de eigenaar van dit project of het project bestaat niet.');
            res.redirect('/');
            return;
        }

        if(document.status == 4 || document.status == 41){
            if (err) return logger.error(err);
            document.archive = true;
            document.save();

            req.flash('info', 'Je project is gearchiveerd');
            res.redirect('/');
        }else{
            req.flash('error', 'Dit project hoort nog niet gearchiveerd te worden!');
            res.redirect('/prints/' + req.params.id);
        }
    });
});

router.get('/:id/delete', account.isLoggedInAsUser, function(req, res){
    printsDB.findOne({
        $and: [
            {_id: req.params.id},
            {owner: req.user._id}
        ]
    }, function(err, document){
        if(document === null){
            req.flash('error', 'Je bent niet de eigenaar van dit project of het project bestaat niet.');
            res.redirect('/');
            return;
        }

        if(document.status == 0 || document.status == 1 || document.status == 2 || document.status == 21){
            if (err) return logger.error(err);

            var fileLocation = document.fileLocation;
            var materialAmount = document.materialAmount;
            document.remove(function(err){
                if (err) return logger.error(err);

                req.user.materialAmountReserved = req.user.materialAmountReserved - materialAmount;
                req.user.materialAmount = req.user.materialAmount + materialAmount;
                req.user.save();

                fs.unlink('./' + fileLocation, function(err){
                    if (err) return logger.error(err);

                    req.flash('info', 'je project is verwijderd');
                    res.redirect('/');
                });
            });
        }else{
            req.flash('error', 'Dit project hoort nog niet verwijderd te worden!');
            res.redirect('/prints/' + req.params.id);
        }
    });
});

router.get('/:id/apply', account.isLoggedInAsUser, function(req, res){
    printsDB.findOne({
        $and: [
            {_id: req.params.id},
            {owner: req.user._id}
        ]
    }, function(err, document){
        if (err) return logger.error(err);
        if(document === null){
            req.flash('error', 'Je bent niet de eigenaar van dit project of het project bestaat niet.');
            res.redirect('/');
            return;
        }

        if(document.status == 0 && document.archive == false){
            document.status = 1;
            document.save();

            req.flash('info', 'Je project is ingediend');
            res.redirect('/');
        }else{
            req.flash('error', 'Dit project hoort nog niet ingediend te worden!');
            res.redirect('/prints/' + req.params.id);
        }
    });
});

router.get('/:id/accept/:boolean', account.isLoggedInAsUser, function(req, res){
    if(req.user.type == 'normal'){
        req.flash('error', 'Je hoort dit niet te doen');
        res.redirect('/');
        return;
    }

    printsDB.findOne({_id: req.params.id}, function(err, document){
        if(document.status == 1 && document.archive == false){
            if(req.params.boolean == 'true'){
                document.status = 2;
                document.priority = 0;
                document.save();

                req.flash('info', 'project "' + document.name + '" is goedgekeurd');
                res.redirect('/supervisor/pending');
            }else if(req.params.boolean == 'false'){
                document.status = 21;
                document.rejectingNotice = "je project is afgewezen";
                document.save();

                req.flash('info', 'project "' + document.name + '" is afgekeurd');
                res.redirect('/supervisor/pending');
            }else{
                logger.info('nor false nor true');
            }
        }else{
            req.flash('error', 'Dit project hoort nog niet ingediend te worden!');
            res.redirect('/prints/' + req.params.id);
        }
    });
});

router.post('/cancel', account.isLoggedInAsUser, function(req, res){
    if(req.user.type == 'admin' || req.user.type == 'supervisor'){
        request.get({
            url: settings.octo_addr + 'api/job',
            headers: {'X-Api-Key': settings.octo_key},
            json: true
        }, function(err, responseJob, bodyJob){
            if (err) callback(err);

            if(bodyJob.job.file.name !== null){
                var jobFile = 'files/stl/' + bodyJob.job.file.name.slice(0, -12);
            }

            request.post({
                url: settings.octo_addr + 'api/job',
                headers: {'X-Api-Key': settings.octo_key},
                json: {
                    "command": "cancel"
                }
            }, function(err, responseCancel, bodyCancel){
                nconf.set('printerFault', true);
                nconf.save(function(err){
                    if (err) return logger.error(err);
                });
                printsDB.findOne({ fileLocation: jobFile }, function(err, document){
                    document.status = 41;
                    document.rejectingNotice = req.body.stopText;
                    document.save();

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

                    res.redirect('/dashboard');
                });
            });
        });
    }else{
        req.flash('error', 'Je mag hier niet zijn!');
        res.redirect('/');
    }
});

module.exports = router;
