var i18n = require("i18n");

i18n.configure({
    locales: ['en', 'nl'],
    directory: cwd + '/locales',
    defaultLocale: 'en',
    cookie: 'lang'
});

module.exports = function(req, res, next){
    i18n.init(req, res);
    res.locals.__ = res.__;
    var currentLocale = i18n.getLocale();

    return next();
};
