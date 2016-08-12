var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
    name: String,
    fileLocation: String,
    owner: String,
    //Status
    //0: not commited
    //1: pending
    //2: approved/waiting 21: Rejected
    //3: printing
    //4: done // 41: failed
    status: Number,
    archive: Boolean,
    canceled: Boolean,
    rejectingNotice: String,
    estimatedPrintTime: Number,
    materialAmount: Number,

    //printing parameters
    P_layerHeight: Number,
    P_shellThickness: Number,
    P_bottomTopThickness: Number,
    P_fillDensity: Number,
    P_printSpeed: Number,

      //Support types:
      //0: None
      //1: Touching Buildplate
      //2: Everywhere
    P_support: Number,

      //Platform adhesion type
      //0: None
      //1: Brim
      //2: Raft
    P_platformAdhesionType: Number,
});

module.exports = mongoose.model('prints', userSchema);
