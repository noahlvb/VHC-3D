var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
    username : String,
    password : String,
    salty: String,
    type: String,
    birthday: String,

    monthlyMaterial: Number,
    materialAmount: Number,
    materialAmountReserved: Number
});

module.exports = mongoose.model('users', userSchema);
