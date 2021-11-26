const express = require('express');
const db = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const {upload} = require('./config/uploadFile.js');
const api = express.Router();

// 메인 슬라이드(배너) 조회
api.get('/', verifyToken, function (req, res) {
    var sql = "select UID as slideUID, imgPath, type, url, page, args, updateDate from main_slide";
	db.query(sql, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});	
	});
});

// cms - 메인 슬라이드(배너) 상세조회
api.get('/:slideUID', verifyAdminToken, function (req, res) {
	var slideUID = req.params.slideUID;
    var sql = "select imgPath, type, url, page, args from main_slide where UID = ?";
	db.query(sql, slideUID, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});	
	});
});

// cms - 메인 슬라이드(배너) 생성
api.post('/', verifyAdminToken, function (req, res) {
	var adminUID = req.adminUID;
	var type = req.body.type;
	var url = req.body.url;
	var page = req.body.page;
	var args = req.body.args;
    var sql = "insert main_slide(type, url, page, args, regUID) values (?, ?, ?, ?, ?)";
	var data = [type, url, page, args, adminUID];

	db.query(sql, data, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: {slideUID: result.insertId}, message:"success"});	
	});
});

// cms - 메인 슬라이드(배너) 이미지 업로드
api.put('/image/:slideUID', 
		verifyAdminToken,
		upload.single("img"), 
		function (req, res) {
			var slideUID = req.params.slideUID;
			var filename = req.file.filename;
			var sql = "update main_slide set imgPath = ? where UID = ?";
			var data = [filename, slideUID];
			db.query(sql, data, function (err, result, fields) {
				if (err) throw err;

				res.status(200).json({status:200, data:{filename: filename}, message: "success"});
			});
		}
);

// cms - 메인 슬라이드(배너) 수정
api.put('/:slideUID', verifyAdminToken, function (req, res) {
	var adminUID = req.adminUID;
	var slideUID = req.params.slideUID;
	var type = req.body.type;
	var url = req.body.url;
	var page = req.body.page;
	var args = req.body.args;
    var sql = "update main_slide set type = ?, url = ?, page = ?, args = ?, updateUID = ? where UID = ?";
	var data = [type, url, page, args, adminUID, slideUID];

	db.query(sql, data, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: "true", message:"success"});	
	});
});

// cms - 메인 슬라이드(배너) 삭제
api.delete('/:slideUID', verifyAdminToken, function (req, res) {
	var slideUID = req.params.slideUID;
    var sql = "delete from main_slide where UID = ?";

	db.query(sql, slideUID, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: "true", message:"success"});	
	});
});

module.exports = api;