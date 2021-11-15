const express = require('express');
const db = require('./config/database.js');
const {verifyAdminToken} = require("./config/authCheck.js");
const {upload} = require('./config/uploadFile.js');
const api = express.Router();

// 카테고리 조회
api.get('/', function (req, res) {
  var sql = "select UID, categoryName, categoryImg from category";
  db.query(sql, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// cms - 카테고리 등록
api.post('/', verifyAdminToken, function (req, res) {
	var categoryName = req.body.categoryName;
	var adminUID = req.adminUID;
    var sql = "insert category(categoryName, regUID) values(?, ?)";
	var data = [categoryName, adminUID];

	db.query(sql, data, function (err, result) {
		if (err) throw err;
		res.status(200).json({status:200, data: {categoryUID: result.insertId}, message:"success"});
	});
});

// cms - 악세사리 이미지 업로드
api.put('/image/:categoryUID', 
		verifyAdminToken,
		upload.single("img"), 
		function (req, res) {
			var categoryUID = req.params.categoryUID;
			var filename = req.file.filename;
			var sql = "update category set categoryImg = ? where UID = ?";
			var data = [filename, categoryUID];
			db.query(sql, data, function (err, result, fields) {
				if (err) throw err;

				res.status(200).json({status:200, data:"true", message: "success"});
			});
		}
);

// cms - 카테고리 수정
api.put('/:categoryUID', verifyAdminToken, function (req, res) {
	var categoryUID = req.params.categoryUID;
	var categoryName = req.body.categoryName;
	var adminUID = req.adminUID;
    var sql = "update category set categoryName = ?, updateUID = ? where UID = ?";
	var data = [categoryName, adminUID, categoryUID];
	db.query(sql, data, function (err, result) {
		if (err) throw err;
		res.status(200).json({status:200, data: "true", message:"success"});
	});
});

module.exports = api;
