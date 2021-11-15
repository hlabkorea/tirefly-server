const express = require('express');
const db = require('./config/database.js');
const {verifyAdminToken} = require("./config/authCheck.js");
const {upload} = require('./config/uploadFile.js');
const api = express.Router();

//악세사리 조회
api.get('/', function (req, res) {
    var sql = "select UID, accName, imgPath, actImgPath from acc";
	db.query(sql, function (err, result) {
		if (err) throw err;
		res.status(200).json({status:200, data: result, message:"success"});	
	});
});

// cms - 악세사리 등록
api.post('/', verifyAdminToken, function (req, res) {
	var accName = req.body.accName;
	var adminUID = req.adminUID;
    var sql = "insert acc(accName, regUID) values(?, ?)";
	var data = [accName, adminUID];
	db.query(sql, data, function (err, result) {
		if (err) throw err;
		res.status(200).json({status:200, data: {accUID: result.insertId}, message:"success"});	
	});
});

// cms - 악세사리 등록
api.put('/:accUID', verifyAdminToken, function (req, res) {
	var accUID = req.params.accUID;
	var accName = req.body.accName;
	var adminUID = req.adminUID;
    var sql = "update acc set accName = ? where UID = ?";
	var data = [accName, accUID];
	db.query(sql, data, function (err, result) {
		if (err) throw err;
		res.status(200).json({status:200, data: {accUID: "true"}, message:"success"});	
	});
});

// cms - 악세사리 이미지 업로드
api.put('/image/:accUID', 
		verifyAdminToken,
		upload.single("img"), 
		function (req, res) {
			var accUID = req.params.accUID;
			var filename = req.file.filename;
			var imgType = req.body.imgType;
			var sql = "update acc set ? = ? where UID = ?";
			var data = [imgType, filename, accUID];
			db.query(sql, data, function (err, result, fields) {
				if (err) throw err;

				res.status(200).json({status:200, data:"true", message: "success"});
			});
		}
);

module.exports = api;