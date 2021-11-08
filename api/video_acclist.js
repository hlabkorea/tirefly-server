const express = require('express');
const db = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const api = express.Router();

// 비디오에 대한 운동 기구 조회
api.get('/:videoUID', verifyToken, function (req, res) {
    var sql = "select acc.UID, acc.accName, acc.rectImgPath as imgPath "
            + "from video_acclist join acc on video_acclist.accUID = acc.UID "
            + "where videoUID = ?";
    var data = req.params.videoUID;

    db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// cms - 비디오에 대한 운동 기구 추가
api.put('/:videoUID', verifyAdminToken, function (req, res) {
	var videoUID = req.params.videoUID;
	var data = [];
	var acc = JSON.parse(req.body.acc);

	for(var i in acc){
		data.push([videoUID, acc[i]]);
	}

	var selectSql = "select UID from video_acclist where videoUID = ?";
	db.query(selectSql, videoUID, function (err, selectResult, fields) {
		if (err) throw err;

		// 이미 video에 대한 운동 기구들이 존재하면 삭제
		if(selectResult.length != 0){
			var deleteData = [];
			for(var i in selectResult){
				deleteData.push(selectResult[i].UID);
			}

			var deleteSql = "delete from video_acclist where UID in (?);";
			db.query(deleteSql, [deleteData], function (err, selectResult, fields) {
				if (err) throw err;
			});
		}

		var insertSql = "insert into video_acclist(videoUID, accUID) values ?;";
		db.query(insertSql, [data], function (err, result, fields) {
			if (err) throw err;

			res.status(200).send({status:200, data: "true", message:"success"});
		});
	});
});

module.exports = api;
