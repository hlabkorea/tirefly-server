const express = require('express');
const db = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const {upload} = require('./config/uploadFile.js');
const fs = require('fs');
const api = express.Router();

// 카테고리에 맞는 음악 조회
api.get('/:categoryUID', verifyToken, function (req, res) {
    var sql = "select UID as musicUID, musicName, artist, musicPath from music where categoryUID = ?";
    var data = req.params.categoryUID;

    db.query(sql, data, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// 카테고리에 맞는 음악 추가
api.post('/', verifyAdminToken, function (req, res) {
	var categoryUID = req.body.categoryUID;
	var musicName = req.body.musicName;
	var artist = req.body.artist;
	var adminUID = req.adminUID;
    var sql = "insert music(categoryUID, musicName, artist, regUID) values (?, ?, ?, ?)";
	var data = [categoryUID, musicName, artist, adminUID];
	
	db.query(sql, data, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: {musicUID: result.insertId}, message: "success"});
	});
});

// cms - 음악 파일 업로드
api.put('/file/:musicUID', 
		verifyAdminToken,
		upload.single("file"), 
		function (req, res) {
			var musicUID = req.params.musicUID;
			var filename = req.file.filename;
			var sql = "update music set musicPath = ? where UID = ?";
			var data = [filename, musicUID];
			db.query(sql, data, function (err, result, fields) {
				if (err) throw err;

				res.status(200).json({status:200, data:{filename: filename}, message: "success"});
			});
		}
);

// 카테고리에 맞는 음악 수정
api.put('/:musicUID', verifyAdminToken, function (req, res) {
	var musicUID = req.params.musicUID;
	var categoryUID = req.body.categoryUID;
	var musicName = req.body.musicName;
	var artist = req.body.artist;
	var adminUID = req.adminUID;
    var sql = "update music set categoryUID = ?, musicName = ?, artist = ?, updateUID = ? where UID = ?";
    var data = [categoryUID, musicName, artist, adminUID, musicUID];

    db.query(sql, data, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: "true", message:"success"});
	});
});

// 카테고리에 맞는 음악 수정
api.delete('/:musicUID', verifyAdminToken, function (req, res) {
	var musicUID = req.params.musicUID;
    var sql = "select musicPath from music where UID = ?";
    
	db.query(sql, musicUID, function (err, result) {
		if (err) throw err;

		var filePath = '../motif-server/views/files/';
		var filename = result[0].musicPath;

		// 파일이 존재하면 삭제
		fs.exists(filePath + filename, function (exists) {
			if(exists){							
				fs.unlink(filePath + filename, function (err) {
					if (err) throw err;
				});
			}
		});

		var deleteSql = "delete from music where UID = ?";
		db.query(deleteSql, musicUID, function (err, result) {
			if (err) throw err;

			res.status(200).json({status:200, data: "true", message:"success"});
		});
	});
});

module.exports = api;
