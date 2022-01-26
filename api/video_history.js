const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// cms - 비디오 재생 이력 조회
api.get('/:userUID', verifyAdminToken, async function (req, res) {
    try {
        const userUID = req.params.userUID;
        var sql = "select a.videoUID, b.videoName, a.playTime, a.complete, a.updateDate " +
            "from video_history a " +
            "join video b on a.videoUID = b.UID " +
            "where a.userUID = ? " +
            "order by a.updateDate desc";
        const [result] = await con.query(sql, userUID);

        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 비디오 재생 이력 저장
api.put('/:videoUID',
    verifyToken,
    [
        check("userUID", "userUID is required").not().isEmpty(),
        check("playTime", "playTime is required").not().isEmpty(),
        check("complete", "complete is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const userUID = req.body.userUID;
                const videoUID = req.params.videoUID;
                const userPlayTime = req.body.playTime;
                const complete = req.body.complete;

                const result = await selectVideoHistory(userUID, videoUID);
                
                if(result.length > 0) { // 재생 이력이 있는 경우
                    const historyUID = result[0].UID;
                    const playTime = result[0].playTime;

                    if(userPlayTime > playTime)
                        await updateVideoHistory(userPlayTime, complete, historyUID);
                } else
                    await insertVideoHistory(userUID, videoUID, userPlayTime);

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// 비디오 재생 이력 조회
async function selectVideoHistory(userUID, videoUID){
    var sql = "select UID, playTime from video_history where userUID = ? and videoUID = ?";
    const sqlData = [userUID, videoUID];
    const [result] = await con.query(sql, sqlData);

    return result;
}

// 비디오 재생 이력 업데이트
async function updateVideoHistory(userPlayTime, historyUID) {
    var sql = "update video_history set playTime = ? where UID = ?";
    const sqlData = [userPlayTime, historyUID];
    await con.query(sql, sqlData);
}

// 비디오 재생 완료 처리
async function updateVideoHistory(userPlayTime, complete, historyUID) {
    var sql = "update video_history set playTime = ?, complete = ? where UID=?";
    const sqlData = [userPlayTime, complete, historyUID];
    await con.query(sql, sqlData);
}

// 비디오 재생 이력 등록
async function insertVideoHistory(userUID, videoUID, userPlayTime) {
    const complete = false;
    var sql = "insert into video_history(userUID, videoUID, playTime, complete) values(?)";
    const sqlData = [userUID, videoUID, userPlayTime, complete];
    await con.query(sql, [sqlData]);
}

module.exports = api;