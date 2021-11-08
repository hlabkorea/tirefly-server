const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');

// 최신 업로드 영상 조회
api.get('/latest', verifyToken, function (req, res) {
  var sql = "select UID as videoUID, videoThumbnail from video where videoType='vod' and status='act' order by regDate desc";

  db.query(sql, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// 요즘 인기있는 영상 조회
api.get('/favorite', verifyToken, function (req, res) {
  var sql = "select video.UID as videoUID, video.videoThumbnail "
          + "from video_history join video on video.UID = video_history.videoUID "
		  + "where video.status = 'act' "
          + "group by video_history.videoUID "
          + "order by video_history.updateDate desc, count(video_history.videoUID) desc";

  db.query(sql, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// vod 검색
api.get('/search', verifyToken, function (req, res) {
  var sql = "select video.UID, teacher.teacherImg, video.videoName, teacher.teacherNickName as teacherName, video.contentsPath, category.categoryName, video.videoLevel, video.playTimeValue, acc.actImgPath as imgPath "
          + "from video "
          + "join category on video.categoryUID = category.UID "
          + "join teacher on video.teacherUID = teacher.UID "
          + "left join video_acclist on video.UID = video_acclist.videoUID "
          + "left join acc on video_acclist.accUID = acc.UID "
		  + "where video.status='act' ";
          
  var data = [];
  var isOption = false;
  var categoryUIDs = req.query.categoryUIDs;
  var videoLevels = req.query.videoLevels;
  var playTimeValues = req.query.playTimeValues;
  var teacherUIDs = req.query.teacherUIDs;

  if(categoryUIDs.length != 0){
    sql += "and category.UID in (?) ";

    data.push(categoryUIDs.split(','));
  }
  
  if(videoLevels.length != 0){
    sql += "and video.videoLevel in (?) ";
    data.push(videoLevels.split(','));
  }
  
  if(playTimeValues.length != 0){
    sql += "and video.playTimeValue in (?) ";
    data.push(playTimeValues.split(','));
  }

  if(teacherUIDs.length != 0){
    sql += "and teacher.UID in (?) ";
    data.push(teacherUIDs.split(','));
  }

  sql += "and video.videoType = ? "
  data.push(req.query.videoType);

  sql += "order by video.regDate desc, video.UID desc";

  var responseData = [];
  var obj = {};

  const execSql = db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		var rowIdx = -1;

      if(result.length > 0){
        for(var i in result){
          if(result[i].UID != rowIdx){
            if(rowIdx != -1)
              responseData.push(obj);

            obj = {};
            rowIdx = result[i].UID;
            obj.videoUID = result[i].UID;
			obj.contentsPath = result[i].contentsPath;
            obj.teacherImg = result[i].contentsPath;
            obj.teacherName = result[i].teacherName;
            obj.videoName = result[i].videoName;
            obj.categoryName = result[i].categoryName;
            obj.videoLevel = result[i].videoLevel;
            obj.playTimeValue = result[i].playTimeValue;
            obj.accImgPath = [];
          }

          if(result[i].imgPath != null)
            obj.accImgPath.push(result[i].imgPath);
        }

        responseData.push(obj);
      }

      res.status(200).send({status:200, data: responseData, message:"success"});
  });

  console.log(execSql.sql);
});

// 라이브 일정 조회
api.get('/live', 
        verifyToken, 
        [
          check("date", "date is required").not().isEmpty()
        ],
        function (req, res) {
          const errors = getError(req, res);
			    if(errors.isEmpty()){
            var sql = "select video.liveStartDate, teacher.teacherImg, video.videoName, teacher.teacherName, video.videoLevel, video.playTimeValue "
                    + "from video "
                    + "join teacher on teacher.UID = video.teacherUID "
                    + "where videoType = 'live' and date(video.liveStartDate) = ? and video.status = 'act' "
                    + "order by liveStartDate";
            var data = req.query.date;

            db.query(sql, data, function (err, result, fields) {
              if (err) throw err;

              res.status(200).json({status:200, data: result, message:"success"});
            });
          }
        }
);

// 추천 영상 조회
api.get('/recommend/:userUID', verifyToken, function (req, res) {
  var sql = "select video.UID, video.videoThumbnail "
          + "from video join my_category on video.categoryUID = my_category.categoryUID "
          + "where my_category.userUID = ? and video.status = 'act' "
          + "order by video.regDate desc ";
  var data = req.params.userUID;

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// 운동 종목 카테고리 상세 목록
api.get('/category/:categoryUID', 
        verifyToken, 
        [
          check("videoType", "videoType is required").not().isEmpty()
        ],
        function (req, res) {
          const errors = getError(req, res);
			    if(errors.isEmpty()){
            var sql = "select video.UID, video.contentsPath, teacher.teacherImg, video.videoName, teacher.teacherNickname, category.categoryName, video.videoLevel, video.playTimeValue, acc.actImgPath as imgPath "
                    + "from video "
                    + "join teacher on video.teacherUID = teacher.UID "
                    + "join category on video.categoryUID = category.UID "
                    + "left join video_acclist on video.UID = video_acclist.videoUID "
                    + "left join acc on video_acclist.accUID = acc.UID "
                    + "where video.categoryUID = ? and video.videoType= ? and video.status = 'act' "
                    + "order by video.regDate desc, video.UID desc";
            var data = [req.params.categoryUID, req.query.videoType];

            var responseData = [];
            var obj = {};

            db.query(sql, data, function (err, result, fields) {
                if (err) throw err;

                var rowIdx = -1;

                if(result.length > 0){
                  for(var i in result){
					  console.log(rowIdx);
                    if(result[i].UID != rowIdx){
                      if(rowIdx != -1)
                        responseData.push(obj);

                      obj = {};
                      rowIdx = result[i].UID;
                      obj.videoUID = result[i].UID;
					  obj.contentsPath = result[i].contentsPath;
                      obj.teacherImg = result[i].contentsPath;
                      obj.teacherName = result[i].teacherNickname;
                      obj.videoName = result[i].videoName;
                      obj.categoryName = result[i].categoryName;
                      obj.videoLevel = result[i].videoLevel;
                      obj.playTimeValue = result[i].playTimeValue;
                      obj.accImgPath = [];
                    }

                    if(result[i].imgPath != null)
                      obj.accImgPath.push(result[i].imgPath);
                  }

                  responseData.push(obj);
                }

                res.status(200).send({status:200, data: responseData, message:"success"});
            });
          }
        }
);

// 상세보기 - 비디오 설명
api.get('/:videoUID', verifyToken, function (req, res) {
  var sql = "select video.UID, video.videoName, category.categoryName, video.videoLevel, video.totalPlayTime, video.playTimeValue, video.contentsPath, video.playContents, "
          + "video.teacherUID, video.videoURL, video.liveStartDate, video.liveEndDate, calorie.consume, video.isPlayBGM "
          + "from video "
          + "join category on video.categoryUId = category.UID "
          + "join calorie on category.UID = calorie.categoryUID "
          + "where video.UID = ? and video.videoLevel = calorie.level";

  var data = req.params.videoUID;

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		result[0].playContents = result[0].playContents.replace(/\\n/gi, "\n").replace(/\r/gi, "");

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

module.exports = api;
