var printsDB = require("./../models/prints.js");
var usersDB = require("./../models/users.js");

function randomIntInc (low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}

module.exports = function(projectID, callback){

    //slice ding in de toekomst

    var estimatedPrintTime = randomIntInc(5, 300);
    var materialAmount = randomIntInc(2, 100);

    printsDB.findOne({ _id: projectID }, function(err, documentPrint){
        usersDB.findOne({ _id: documentPrint.owner}, function(err, documentUser){
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
        });
    });
};
