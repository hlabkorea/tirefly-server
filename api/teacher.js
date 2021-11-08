const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

// 강사 목록 조회
api.get('/', verifyToken, function (req, res) {
  var sql = "select UID as teacherUID, teacherName, teacherNickName from teacher";

  db.query(sql, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message: "success"});
	});
});


// 강사 정보 조회
api.get('/:teacherUID', verifyToken, function (req, res) {
  var sql = "select teacher.teacherImg, teacher.teacherNickName, teacher.teacherIntroduce, teacher.teacherCareer, teacher.teacherInstagram, teacher.teacherYoutube "
          + "from teacher "
          + "where UID = ?";
  var data = req.params.teacherUID;

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({
                          status:200,
                          data: result[0],
                          message:"success"}
    );
	});
});

module.exports = api;
