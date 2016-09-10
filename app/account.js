var crypto = require("crypto");

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

exports.isLoggedInAsUser = isLoggedInAsUser;
exports.isLoggedInAsAdmin = isLoggedInAsAdmin;
exports.generateHash = generateHash;
exports.validPassword = validPassword;
