var passport         = require("passport"),
    passportSocketIo = require("passport.socketio"),
    cookieParsers    = require("cookie-parser"),
    expressSession   = require("express-session"),
    connectMongo     = require("connect-mongo")(expressSession),
    util             = require("util"),
    socket           = require("socket.io");
    
var settings = require("./../config/settings");
require("./passport")(passport, settings);

module.exports = function(server){
    
    var io = socket.listen(server);
    
    io.use(passportSocketIo.authorize({
        cookieParser: cookieParsers,
        key:         'connect.sid',
        secret:      settings.secret,
        store:       new connectMongo({url: settings.db}),
        success:     onAuthorizeSuccess,
        fail:        onAuthorizeFail,
    }));
    
    function onAuthorizeSuccess(data, accept) {
        accept();
    }
    
    function onAuthorizeFail(data, message, error, accept) {
        if(error){  
            throw new Error(message);
        }
        
        accept(new Error(message));
    }
    
    io.on('connection', function (socket) {
        
    });
};