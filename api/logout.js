const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

// 로그아웃
api.delete('/', verifyToken, function (req, res) {
    var token = req.headers.token;

    var sql = "delete from user_log where token = ?"
    db.query(sql, token, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: "true", message:"success"});
	});
});

module.exports = api;