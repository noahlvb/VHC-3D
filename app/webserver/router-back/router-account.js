var express = require("express");
var util = require("util");

var usersDB = require("./../../../models/users");
var account = require("./../../account");

var router = express.Router();

// send user list
router.get('/list', account.isLoggedInAsAdmin, function(req, res){
	usersDB.find({}, function (err, users) {

		if (err) return util.error(err);

        var userMap = {};

        for (var i = 0; i < users.length; i++ ) {
            var individualUser = {};
            individualUser["id"]       					= users[i]._id;
            individualUser["username"] 					= users[i].username;
			individualUser["email"]						= users[i].email;
            individualUser["type"]     					= users[i].type;
			individualUser["monthlyMaterial"] 			= users[i].monthlyMaterial;
			individualUser["materialAmount"] 			= users[i].materialAmount;
			individualUser["materialAmountReserved"] 	= users[i].materialAmountReserved;
            userMap[i] = individualUser;
        }

        res.json(userMap);
	});
});

// add a user
router.post('/add', account.isLoggedInAsAdmin, function (req, res) {
    usersDB.findOne({username : req.body.username}, function (err, document) {
        if(document === null){

            var hashed = account.generateHash(req.body.password);

            if(req.body.username == false || req.body.password == false || req.body.type == false || req.body.birthday == false){
                req.flash('error', 'not all the fields are filled');
                res.redirect('/admin/account/add');
            }else{

                data = {
                    username : req.body.username,
					emails : req.body.email,
                    password : hashed.hashy,
                    salty : hashed.salt,
                    type : req.body.selectType,

					monthlyMaterial : 500,
				    materialAmount : 500,
				    materialAmountReserved : 0
                };

                new usersDB(data).save(function (err, data) {
                    if(err){
                        req.flash('error', 'An error occurred');
                        res.redirect('/admin/account/add');
                    }
                });

                req.flash('info', 'account is created');
                res.redirect('/admin/account');
            }
        }else{
            req.flash('error', 'The username is already used');
            res.redirect('/admin/account/add');
        }
    });
});

//get info about specific user
router.get('/userinfo/:id/', account.isLoggedInAsAdmin, function (req, res) {
    usersDB.findOne({_id: req.params.id}, function (err, document) {
        if(document === null){
            req.flash('error', 'User not found');
            res.status(404).end();
        }

        res.json(document);
    });
});

// update the username of a user
router.get('/update/:field/:id/:value', account.isLoggedInAsAdmin, function (req, res) {
    usersDB.findOne({ _id: req.params.id}, function (err, document) {
        if(document === null){
            req.flash('error', 'User not found');
            res.status(404).redirect('/admin/account/profile/' + req.params.id + '/');
        }else{
            document[req.params.field] = req.params.value;
            document.save();
            req.flash('info', 'succesfully edited');
            res.status(202).redirect('/admin/account/profile/' + req.params.id + '/');
        }
    });
});

// update the type of a user
router.get('/update/type/:id/:type', account.isLoggedInAsAdmin, function (req, res) {
    usersDB.findOne({ _id: req.params.id}, function (err, document) {
        if(document === null){
            req.flash('error', 'User not found');
            res.status(404).redirect('/admin/account/profile/' + req.params.id + '/');
        }else{
            if(req.params.type == 'normal' || req.params.type == 'supervisor' || req.params.type == 'admin'){
                document.type = req.params.type;
                document.save();
                req.flash('info', 'successfully edited');
                res.status(202).redirect('/admin/account/profile/' + req.params.id + '/');
            }else{
                req.flash('error', 'Not a valid type');
                res.status(400).redirect('/admin/account/profile/' + req.params.id + '/');
            }
        }
    });
});

// delete a user
router.get('/del/:id', account.isLoggedInAsAdmin, function (req, res) {
    usersDB.findOne({_id: req.params.id}, function (err, document) {
        if(document === null){
            res.status(404).send('user not found');
        }else{
            usersDB.remove({ _id : req.params.id }, function (err) {
                if(!err){
                    req.flash('info', 'User deleted!');
                    res.status(202).redirect('/admin/account');
                }else{
                    req.flash('error', 'cannot delete user');
                    res.status(500).redirect('/admin/account');
                }
            });
        }
    });
});

module.exports = router;
