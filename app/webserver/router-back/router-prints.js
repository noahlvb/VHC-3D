var express = require("express");
var util = require("util");
var fs = require("fs");

var printsDB = require("./../../../models/prints");
var account = require("./../../account");

var router = express.Router();

router.post('/add', account.isLoggedInAsUser, function(req, res){
    if(req.body.name == false || req.file == undefined || req.body.P_layerHeight == false || req.body.P_shellThickness == false || req.body.P_bottomTopThickness == false || req.body.P_fillDensity == false || req.body.P_printSpeed == false || req.body.P_support == false || req.body.P_platformAdhesionType == false){
        req.flash('error', 'niet alle velden zijn ingevuld a');
        res.redirect('/prints/add');
        return;
    }
    if(req.body.P_support < 0 || req.body.P_support > 3){
        req.flash('error', 'niet alle velden zijn ingevuld b');
        res.redirect('/prints/add');
        return;
    }
    if(req.body.P_platformAdhesionType < 0 || req.body.P_platformAdhesionType > 3){
        req.flash('error', 'niet alle velden zijn ingevuld c');
        res.redirect('/prints/add');
        return;
    }

    var originalName = String(req.file.originalname);
    var fileExtension = originalName.split(".")[1];
    if(fileExtension != 'stl'){
        req.flash('error', 'Geuploade bestand is geen STL bestand');
        res.redirect('/prints/add');
        return;
    }

    data = {
        name: req.body.name,
        fileLocation: 'files/slt/' + req.file.filename + '.stl',
        owner: req.user._id,
        status: 0,
        archive: false,
        canceled: false,
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

    fs.rename(req.file.path, 'files/slt/' + req.file.filename + '.stl', function(err){
        if(err){
            console.error(err);
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
        });
    });

    req.flash('info', 'Je printje is succesvol geupload');
    res.redirect('/');
});

router.get('/list/:status/', account.isLoggedInAsUser, function(req, res){
    printsDB.find({owner: req.user._id, status: req.params.status}, function(err, result){
        if (err) return console.error(err);

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
            {$or: [{status: 1}, {status: 2}, {status: 3}, {status: 4}]}
        ]
    }, function(err, result){
        if (err) return console.error(err);

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

module.exports = router;
