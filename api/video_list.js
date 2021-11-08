const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

// 비디오 운동 리스트 조회
api.get('/:videoUID', verifyToken, function (req, res) {
  var sql = "select UID as listUID, listName, listStartTime, listPlayTime from video_list where videoUID = ? order by video_list.order";
  var data = [req.params.videoUID];

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

    res.status(200).json({status:200, data: result, message:"success"});
	});
});

module.exports = api;
