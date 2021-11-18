const express = require('express');
const db = require('./config/database.js');
const {verifyAdminToken} = require("./config/authCheck.js");
const {upload} = require('./config/uploadFile.js');
const api = express.Router();

// 카테고리 조회
api.get('/', function (req, res) {
	var sql = "select UID, categoryName, categoryImg, status from category";
	db.query(sql, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// cms - 카테고리 조회
api.get('/:categoryUID', function (req, res) {
	var categoryUID = req.params.categoryUID;
	var sql = "select categoryName, categoryImg, status from category where UID = ?";
	db.query(sql, categoryUID, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// cms - 카테고리 등록
api.post('/', verifyAdminToken, function (req, res) {
	var categoryName = req.body.categoryName;
	var adminUID = req.adminUID;
	var status = req.body.status;
    var sql = "insert category(categoryName, regUID, status) values(?, ?, ?)";
	var data = [categoryName, adminUID, status];

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

				res.status(200).json({status:200, data:{filename: filename}, message: "success"});
			});
		}
);

// cms - 카테고리 활성화 여부 수정
api.put('/status/:categoryUID', verifyAdminToken, function (req, res) {
	var categoryUID = req.params.categoryUID;
	var status = req.body.status;
	var sql = "update category set status = ? where UID = ?";
	var data = [status, categoryUID];
	db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).send({status:200, data: "true", message:"success"});
	});
});

// cms - 카테고리 수정
api.put('/:categoryUID', verifyAdminToken, function (req, res) {
	var categoryUID = req.params.categoryUID;
	var categoryName = req.body.categoryName;
	var status = req.body.status;
	var adminUID = req.adminUID;
    var sql = "update category set categoryName = ?, status = ?, updateUID = ? where UID = ?";
	var data = [categoryName, status, adminUID, categoryUID];
	db.query(sql, data, function (err, result) {
		if (err) throw err;
		res.status(200).json({status:200, data: "true", message:"success"});
	});
});

module.exports = api;
