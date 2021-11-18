const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');

// 프로그램의 비디오 재생 이력 저장
api.put('/:programUID', 
        verifyToken, 
        [
			check("userUID", "userUID is required").not().isEmpty(),
            check("videoUID", "videoUID is required").not().isEmpty(),
            check("playTime", "playTime is required").not().isEmpty(),
			check("complete", "complete is required").not().isEmpty()
		],
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                var sql = "select UID, playTime from program_history where userUID = ? and videoUID = ? and programUID = ?";
                var data = [req.body.userUID, req.body.videoUID, req.params.programUID];
                
                db.query(sql, data, function (err, result) {
                    if (err) throw err;

                    var clientPlayTime = req.body.playTime;
                    var clientComplete = req.body.complete;
                    var changed = true;

                    if(result.length != 0){
                        var programHistoryUID = result[0].UID;
                        
                        if(clientPlayTime > result[0].playTime){ // 현재 저장된 시간보다 더 시청했을 때 이력 업데이트
                            if(clientComplete){
                                sql = "update program_history set playTime = ?, complete = ? where UID = ?";
                                data = [clientPlayTime, clientComplete, programHistoryUID];
                            } else {
                                sql = "update program_history set playTime = ? where UID = ?";
                                data = [clientPlayTime, programHistoryUID];
                            }
                        } else {
                            changed = false;
                        }
                    } else{ // 현재 저장된 이력이 없다면 저장
                        sql = "insert into program_history(userUId, videoUID, programUID, playTime, complete) values(?, ?, ?, ?, ?)";
                        data.push(clientPlayTime);
                        data.push(clientComplete);
                    }

                    if(changed){
                        db.query(sql, data, function (err, result) {
                            if (err) throw err;
                        });
                    }

                    res.json({status:200, data: "true", message: "success"});
                });
            }
        }
);

// 진행 중인 프로그램 조회
api.get('/proceeding/:userUID', verifyToken, function (req, res) {
    var sql = "select my_program.programUID, ifnull(sum(complete), 0) as completeCount "
            + "from program_history "
            + "right join my_program on program_history.programUID = my_program.programUID and program_history.userUID = my_program.userUID "
			+ "where my_program.userUID = ?"
            + "group by my_program.programUID "
            + "order by my_program.regDate desc";
    var data = req.params.userUID;

    db.query(sql, data, function (err, result) {
            if (err) throw err;

            res.json({status:200,  data: result, message:"success"});
    });
});

// 프로그램 재생 이력 조회
api.get('/:userUID', function (req, res) {
	var userUID = req.params.userUID;
    var sql = "select program_history.programUID, program.programName, video.videoName, program_history.playTime, program_history.complete, program_history.updateDate "
			+ "from program_history "
			+ "join program on program_history.programUID = program.UID "
			+ "join video on program_history.videoUID = video.UID "
			+ "where program_history.userUID = ?";
	db.query(sql, userUID, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});	
	});
});

module.exports = api;