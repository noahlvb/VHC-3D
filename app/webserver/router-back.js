var express = require("express");

var router = express.Router();

router.use('/account', require('./router-back/router-account.js'));
router.use('/prints', require('./router-back/router-prints.js'));

module.exports = router;
