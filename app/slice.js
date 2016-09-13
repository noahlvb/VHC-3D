var fs = require("fs");
var request = require("request");

var printsDB = require("./../models/prints.js");
var usersDB = require("./../models/users.js");
var settings = require("./../config/settings");

Number.prototype.toFixedDown = function(digits) {
    var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
        m = this.toString().match(re);
    return m ? parseFloat(m[1]) : this.valueOf();
};

module.exports = function(projectID, hypothesis, callback){
    printsDB.findOne({ _id: projectID }, function(err, documentPrint){
        usersDB.findOne({ _id: documentPrint.owner}, function(err, documentUser){

            var formData = {
                file: fs.createReadStream('./' + documentPrint.fileLocation),
                select: 'false',
                print: 'false'
            };

            var P_support = 'None';
            var P_platformAdhesionType = 'None';
            if(documentPrint.P_support == 1){
                P_support = 'Touching buildplate';
            }else if(documentPrint.P_support == 2){
                P_support = 'Everywhere';
            }
            if(documentPrint.P_platformAdhesionType == 1){
                P_platformAdhesionType = 'Brim';
            }else if(documentPrint.P_platformAdhesionType == 2){
                P_platformAdhesionType = 'Raft';
            }

            var sliceRawBody = {
                "command": "slice",
                "slicer": "cura",
                "gcode": documentPrint.fileLocation.substr(-25) + '.gcode',
                "printerProfile": "Default",
                "profile": "defaultprintprofile",
                "profile.layer_height": documentPrint.P_layerHeight,
                "profile.wall_thickness": documentPrint.P_shellThickness,
                "profile.solid_layer_thickness": documentPrint.P_bottomTopThickness,
                "profile.fill_density": documentPrint.P_fillDensity,
                "profile.print_speed": documentPrint.P_printSpeed,
                "profile.support": P_support,
                "profile.platform_adhesion": P_platformAdhesionType,
                "print": false,
                "select": false
            }

            var estimatedPrintTime = 0;
            var materialAmount = 0;

            request.post({
                url: settings.octo_addr + 'api/files/local',
                headers: {'X-Api-Key': settings.octo_key},
                json: true,
                formData: formData
            }, function(err, response, body){
                if (err) return console.error(err);
                if (response.statusCode != 201) return callback(2);

                request.post({
                    url: settings.octo_addr + 'api/files/local/' + documentPrint.fileLocation.substr(-25),
                    headers: {'X-Api-Key': settings.octo_key},
                    json: sliceRawBody
                }, function(err, response, body){
                    if (err) return console.error(err);
                    if (response.statusCode != 202) return callback(2);

                    var checkForGCODE = setInterval(function(){
                        request.get({
                            url: settings.octo_addr + 'api/files/local/' + documentPrint.fileLocation.substr(-25) + '.gcode',
                            headers: {'X-Api-Key': settings.octo_key},
                            json: true
                        }, function(err, response, body){
                            if (err) return console.error(err);
                            if (response.statusCode != 200) return callback(2);

                            if(response.statusCode == 200 && body.gcodeAnalysis){
                                var estimatedPrintTimeNonRound = body.gcodeAnalysis.estimatedPrintTime / 60;
                                estimatedPrintTime = estimatedPrintTimeNonRound.toFixedDown(2);
                                materialAmount = body.gcodeAnalysis.filament.tool0.volume.toFixedDown(2);

                                if(hypothesis === true){
                                    setTimeout(function(){
                                        request.delete({
                                            url: settings.octo_addr + 'api/files/local/' + documentPrint.fileLocation.substr(-25) + '.gcode',
                                            headers: {'X-Api-Key': settings.octo_key}
                                        }, function(err, response, body){
                                            if (err) return console.error(err);
                                        });
                                    }, 5000);
                                }
                                clearInterval(checkForGCODE);
                                applyValues();
                            }
                        });
                    }, 250);
                });
            });

            function applyValues(){
                if(documentPrint.materialAmount == 0 && materialAmount <= documentUser.materialAmount){
                    documentUser.materialAmountReserved = documentUser.materialAmountReserved + materialAmount
                    documentUser.materialAmount = documentUser.materialAmount - materialAmount;
                    documentPrint.materialAmount = materialAmount;
                    documentPrint.estimatedPrintTime = estimatedPrintTime;
                    documentUser.save();
                    documentPrint.save();
                    callback(0);
                }else if(documentPrint.materialAmount > 0){
                    var diffMaterialAmountprint = materialAmount - documentPrint.materialAmount;

                    if(diffMaterialAmountprint < 0 || diffMaterialAmountprint <= documentUser.materialAmount){
                        documentUser.materialAmountReserved = documentUser.materialAmountReserved + diffMaterialAmountprint;
                        documentUser.materialAmount = documentUser.materialAmount - diffMaterialAmountprint;
                        documentPrint.materialAmount = materialAmount;
                        documentPrint.estimatedPrintTime = estimatedPrintTime;
                        documentUser.save();
                        documentPrint.save();
                        callback(0);
                    }else{
                        callback(1);
                    }
                }else{
                    callback(1);
                }
            }
        });
    });
};
