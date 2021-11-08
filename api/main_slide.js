const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

//메인 슬라이드 조회
api.get('/', verifyToken, function (req, res) {
    var sql = "select imgPath, type, url, page, args from main_slide";
	db.query(sql, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});	
	});
});

module.exports = api;