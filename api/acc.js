const express = require('express');
const db = require('./config/database.js');
const api = express.Router();

//악세사리 조회
api.get('/', function (req, res) {
    var sql = "select UID, accName, imgPath, actImgPath from acc";
	db.query(sql, function (err, result) {
		if (err) throw err;
		res.status(200).json({status:200, data: result, message:"success"});	
	});
});

module.exports = api;