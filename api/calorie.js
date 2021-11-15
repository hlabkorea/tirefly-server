const express = require('express');
const db = require('./config/database.js');
const {verifyAdminToken} = require("./config/authCheck.js");
const {upload} = require('./config/uploadFile.js');
const api = express.Router();

// cms - 카테고리의 칼로리 등록
api.post('/', verifyAdminToken, function (req, res) {
	var categoryUID = req.body.categoryUID;
	var adminUID = req.adminUID;
	var lv1Consume = req.body.lv1Consume;
	var lv2Consume = req.body.lv2Consume;
	var lv3Consume = req.body.lv3Consume;

	var lv1Sql = "insert calorie(categoryUID, level, consume, regUID) values(?, '초급', ?, ?);";
	var lv2Sql = "insert calorie(categoryUID, level, consume, regUID) values(?, '중급', ?, ?);";
	var lv3Sql = "insert calorie(categoryUID, level, consume, regUID) values(?, '고급', ?, ?);";
	var data = [categoryUID, lv1Consume, adminUID, categoryUID, lv2Consume, adminUID, categoryUID, lv3Consume, adminUID];

	db.query(lv1Sql + lv2Sql + lv3Sql, data, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: "true", message:"success"});	
	});
});

module.exports = api;
