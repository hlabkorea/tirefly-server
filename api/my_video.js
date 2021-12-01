const express = require('express');
const db = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 비디오에 대한 좋아요 여부 조회
api.get('/isLike/:videoUID', 
        verifyToken,
        [
          check("userUID", "userUID is required").not().isEmpty()
        ],
        function (req, res) {
          const errors = getError(req, res);
			    if(errors.isEmpty()){
            var sql = "select UID from my_video where userUID = ? and videoUID = ?";
            var data = [req.query.userUID, req.params.videoUID];

            db.query(sql, data, function (err, result, fields) {
              if (err) throw err;

              if(result.length > 0){
                res.status(200).json({status:200, data: "true", message:"success"});
              } else{
                res.status(200).json({status:200, data: "false", message:"success"})
              }
            });
          }
        }
);

// 좋아하는 영상 조회
api.get('/:userUID', verifyToken, function (req, res) {
  var sql = "select video.UID as videoUID, video.videoThumbnail "
          + "from my_video join video on my_video.videoUID = video.UID "
          + "where my_video.userUID = ? and video.status = 'act' "
          + "order by my_video.regDate desc";
  var data = req.params.userUID;

  db.query(sql, data, function (err, result, fields) {
    if (err) throw err;
    var responseData = [];

    for(var i in result){
      responseData.push(result[i]);
    }
    res.status(200).json({status:200, data: responseData, message:"success"});
  });
});

// 좋아요 하기 / 취소하기 (기존데이터 삭제후 새로운 데이터 삽입)
api.put('/:videoUID', 
        verifyToken, 
        [
          check("userUID", "userUID is required").not().isEmpty()
        ],
        function (req, res) {
          const errors = getError(req, res);
			    if(errors.isEmpty()){
            var sql = "select UID from my_video where userUID = ? and videoUID = ?";

            var data = [req.body.userUID, req.params.videoUID];
            var message = "";
            db.query(sql, data, function (err, result) {
              if (err) throw err;

              if(result.length > 0){
                sql = "delete from my_video where UID = ?";
                data = result[0].UID;
                message = "좋아요가 취소되었습니다";
              } else{
                sql = "insert into my_video(userUID, videoUID) values(?, ?)";
                message = "좋아요가 등록되었습니다";
              }

              db.query(sql, data, function (err, result, fields) {
                if (err) throw err;

                res.status(200).json({status:200, data: "true", message: message});
              });
            });
          }
        }
);

module.exports = api;
