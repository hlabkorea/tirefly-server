const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

// 비디오에 대한 운동 기구 조회
api.get('/:videoUID', verifyToken, function (req, res) {
  var sql = "select acc.accName, acc.actImgPath "
          + "from video_acclist join acc on video_acclist.accUID = acc.UID "
          + "where videoUID = ?";
  var data = req.params.videoUID;

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		for(var i=0; i<result.length; i++){
			result[i].imgPath = result[i].actImgPath;
		}

		res.status(200).json({status:200, data: result, message:"success"}
    );
	});
});

module.exports = api;
