const express = require('express');
const db = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const api = express.Router();

// 비디오 운동 리스트 조회
api.get('/:videoUID', verifyToken, function (req, res) {
  var sql = "select UID as listUID, listName, listStartTime, listPlayTime, video_list.order from video_list where videoUID = ? order by video_list.order";
  var data = [req.params.videoUID];

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

    res.status(200).json({status:200, data: result, message:"success"});
	});
});

// cms - 비디오 리스트 추가
api.put('/:videoUID', verifyAdminToken, function (req, res) {
	var adminUID = req.adminUID;
	var videoUID = req.params.videoUID;
	var data = [];
	var videoList = req.body.videoList;

	for(var i in videoList){
		data.push([videoUID, videoList[i].listName, videoList[i].order, videoList[i].listStartTime, videoList[i].listPlayTime, adminUID]);
	}

	var selectSql = "select UID from video_list where videoUID = ?";
	db.query(selectSql, videoUID, function (err, selectResult, fields) {
		if (err) throw err;

		// 이미 video에 대한 운동 기구들이 존재하면 삭제
		if(selectResult.length != 0){
			var deleteData = [];
			for(var i in selectResult){
				deleteData.push(selectResult[i].UID);
			}

			var deleteSql = "delete from video_list where UID in (?);";
			db.query(deleteSql, [deleteData], function (err, selectResult, fields) {
				if (err) throw err;
			});
		}

		if(videoList.length != 0){
			var sql = "insert into video_list(videoUID, listName, video_list.order, listStartTime, listPlayTime, regUID) values ?;";
			db.query(sql, [data], function (err, result, fields) {
				if (err) throw err;
			});
		}	

		res.status(200).send({status:200, data: "true", message:"success"});
	});
});

module.exports = api;
