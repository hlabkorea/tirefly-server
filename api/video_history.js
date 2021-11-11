const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');

// 비디오 재생 이력 저장
api.put('/:videoUID', 
        verifyToken, 
        [
            check("userUID", "userUID is required").not().isEmpty(),
            check("playTime", "playTime is required").not().isEmpty(),
            check("complete", "complete is required").not().isEmpty()
		],
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                var sql = "select UID, playTime from video_history where userUID = ? and videoUID = ?";
                var data = [req.body.userUID, req.params.videoUID];
                
                db.query(sql, data, function (err, result, fields) {
                    if (err) throw err;

                    var clientPlayTime = req.body.playTime;
                    var clientComplete = req.body.complete;
                    var changed = true;

                    if(result.length != 0){
                        var videoHistoryUID = result[0].UID;
                        
                        if(clientPlayTime > result[0].playTime){ // 현재 저장된 시간보다 더 시청했을 때 이력 업데이트
                            if(clientComplete){
                                sql = "update video_history set playTime = ?, complete = ? where UID=?";
                                data = [clientPlayTime, clientComplete, videoHistoryUID];
                            } else {
                                sql = "update video_history set playTime = ?, where UID = ?";
                                data = [clientPlayTime, videoHistoryUID];
                            }
                        } else {
                            changed = false;
                        }
                    } else{ // 현재 저장된 이력이 없다면 저장
                        sql = "insert into video_history(userUID, videoUID, playTime, complete) values(?, ?, ?, ?)";
                        data.push(clientPlayTime);
                        data.push(clientComplete);
                    }

                    if(changed){
                        db.query(sql, data, function (err, result, fields) {
                            if (err) throw err;
                        });
                    }

                    res.status(200).json({status:200, data: "true", message: "success"});
                });
            }
        }
);

module.exports = api;