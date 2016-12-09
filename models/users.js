var mongoose = require("mongoose");

var userSchema = mongoose.Schema({
    google : {
        id : String,
        token : String
    },

    username : String,
    password : String,
    salty: String,
    type: String,
    email: String,

    monthlyMaterial: Number,
    materialAmount: Number,
    materialAmountReserved: Number
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('users', userSchema);
