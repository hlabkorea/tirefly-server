const express = require('express');
const { con } = require('./config/database.js');
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
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const userUID = req.query.userUID;
                const videoUID = req.params.videoUID;
                var sql = "select UID from my_video where userUID = ? and videoUID = ?";
                const sqlData = [userUID, videoUID];
                const [result] = await con.query(sql, sqlData);

                if (result.length > 0) { // 좋아요 했을 경우
                    res.status(200).json({
                        status: 200,
                        data: "true",
                        message: "success"
                    });
                } else { // 좋아요 하지 않았을 경우
                    res.status(200).json({
                        status: 200,
                        data: "false",
                        message: "success"
                    })
                }
            } catch (err) {
                throw err;
            }
        }
    }
);

// 좋아요 한 영상 조회
api.get('/:userUID', verifyToken, async function (req, res) {
    try{
        const userUID = req.params.userUID;
        var sql = "select b.UID as videoUID, b.videoThumbnail " +
            "from my_video a " +
            "join video b on a.videoUID = b.UID " +
            "where a.userUID = ? and b.status = 'act' " +
            "order by a.regDate desc";
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

// 좋아요 하기 / 취소하기 (기존데이터 삭제후 새로운 데이터 삽입)
api.put('/:videoUID',
    verifyToken,
    [
        check("userUID", "userUID is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const videoUID = req.params.videoUID;
                const userUID = req.body.userUID;
                const myVideoUID = await selectMyVideoUID(userUID, videoUID);
                var message = "";

                if(myVideoUID > 0){
                    await deleteMyVideo(myVideoUID);
                    message = "좋아요가 취소되었습니다";
                }
                else{
                    await insertMyVideo(userUID, videoUID);
                    message = "좋아요가 등록되었습니다";
                }

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: message
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// 좋아요 목록의 UID 조회
async function selectMyVideoUID(userUID, videoUID){
    var sql = "select UID from my_video where userUID = ? and videoUID = ?";
    const sqlData = [userUID, videoUID];
    const [result] = await con.query(sql, sqlData);
    if(result.length != 0)
        return result[0].UID;
    else    
        return 0;
}

// 좋아요 목록에서 삭제
async function deleteMyVideo(myVideoUID){
    var sql = "delete from my_video where UID = ?";
    await con.query(sql, myVideoUID);
}

// 좋아요 목록에 등록
async function insertMyVideo(userUID, videoUID){
    var sql = "insert into my_video(userUID, videoUID) values(?, ?)";
    const sqlData = [userUID, videoUID];
    await con.query(sql, sqlData);
}

module.exports = api;
