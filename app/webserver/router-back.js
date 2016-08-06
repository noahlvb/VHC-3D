var express = require("express");

var router = express.Router();

router.use('/account', require('./router-back/router-account.js'));

module.exports = router;
