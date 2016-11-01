var crypto = require("crypto");

var usersDB = require("../models/users");

function generateHash (password){
    var saltPre = crypto.randomBytes(64);
    var salt = saltPre.toString('hex');
    var hash = crypto.pbkdf2Sync(password, salt, 10000, 64);

    var result = {'hashy' : hash.toString('hex'), 'salt' : salt};
    return result;
}

function validPassword (password, hashed, salt) {
    var hash = crypto.pbkdf2Sync(password, salt, 10000, 64);

    if(hashed == hash.toString('hex')){
        return true;
    }

    return false;
}

function isLoggedInAsAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.type == 'admin'){
        return next();
    }else{
        res.status(403).redirect('/login');
    }
}

function isLoggedInAsUser(req, res, next) {
    if (req.isAuthenticated()){
        return next();
    }else{
        res.status(403).redirect('/login');
    }
}

usersDB.findOne({type: "admin"}, function(err, document){
    if(!document){

        var hashed = generateHash('VHC-3D');

        var data = {
            username : "admin",
            emails : "Unknown",
            password : hashed.hashy,
            salty : hashed.salt,
            type : "admin",

            monthlyMaterial : 500,
            materialAmount : 500,
            materialAmountReserved : 0
        };

        new usersDB(data).save(function(err, data){
            if(err){
                logger.error('Could not make admin account');
            }else{
                logger.info('Admin account is created. Username: admin Password: VHC-3D');
            }
        });
    }
});

exports.isLoggedInAsUser = isLoggedInAsUser;
exports.isLoggedInAsAdmin = isLoggedInAsAdmin;
exports.generateHash = generateHash;
exports.validPassword = validPassword;
