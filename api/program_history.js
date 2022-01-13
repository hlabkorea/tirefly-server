const express = require('express');
const { con } = require('./config/database.js');
const db = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 진행 중인 프로그램 조회
api.get('/proceeding/:userUID', verifyToken, function (req, res) {
    var sql = "select my_program.programUID, ifnull(sum(complete), 0) as completeCount " +
        "from program_history " +
        "right join my_program on program_history.programUID = my_program.programUID and program_history.userUID = my_program.userUID " +
        "join program on my_program.programUID = program.UID " +
        "where program.status = 'act' and my_program.userUID = ? " +
        "group by my_program.programUID " +
        "order by my_program.regDate desc";
    var data = req.params.userUID;

    db.query(sql, data, function (err, result) {
        if (err) throw err;

        res.json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

/*
// 진행 중인 프로그램 조회
api.get('/proceeding/:userUID', verifyToken, async function (req, res) {
    try {
        const userUID = req.params.userUID;
        var sql = "select b.programUID, ifnull(sum(a.complete), 0) as completeCount " +
            "from program_history a " +
            "right join my_program b on a.programUID = b.programUID and a.userUID = b.userUID " +
            "join program c on b.programUID = c.UID " +
            "where c.status = 'act' and b.userUID = ? " +
            "group by b.programUID " +
            "order by b.regDate desc";
        const [result] = await con.query(sql, userUID);

        res.json({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});
*/
// 프로그램 상세정보 조회
api.get('/:userUID', verifyToken, async function (req, res) {
    try {
        const userUID = req.params.userUID;
        var sql = "select a.programUID, c.programName, b.videoName, a.playTime, a.complete, a.updateDate " +
            "from program_history a " +
            "join program c on a.programUID = c.UID " +
            "join video b on a.videoUID = b.UID " +
            "where a.userUID = ?";
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

// 프로그램의 비디오 재생 이력 저장
api.put('/:programUID',
    verifyToken,
    [
        check("userUID", "userUID is required").not().isEmpty(),
        check("videoUID", "videoUID is required").not().isEmpty(),
        check("playTime", "playTime is required").not().isEmpty(),
        check("complete", "complete is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const programUID = req.params.programUID;
                const userUID = req.body.userUID;
                const videoUID = req.body.videoUID;
                const userPlayTime = req.body.playTime;
                const complete = req.body.complete;

                const result = await selectProgramHistory(userUID, videoUID, programUID);

                if (result.length > 0) { // 재생 이력이 있는 경우
                    const historyUID = result[0].UID;
                    const playTime = result[0].playTime;

                    if (userPlayTime > playTime) { // 현재 저장된 시간보다 더 시청했을 때 이력 업데이트
                        if (complete)
                            await completeProgramHistory(userPlayTime, complete, historyUID);
                        else
                            await updateProgramHistory(userPlayTime, historyUID);
                    }
                } else // 재색 이력이 없는 경우
                    await insertProgramHistory(userUID, videoUID, programUID, userPlayTime);

                res.json({
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

// 프로그램의 비디오 재생 이력 조회
async function selectProgramHistory(userUID, videoUID, programUID) {
    var sql = "select UID, playTime from program_history where userUID = ? and videoUID = ? and programUID = ?";
    const sqlData = [userUID, videoUID, programUID];
    const [result] = await con.query(sql, sqlData);

    return result;
}

// 프로그램의 비디오 재생 이력 업데이트
async function updateProgramHistory(userPlayTime, historyUID) {
    var sql = "update program_history set playTime = ? where UID = ?";
    const sqlData = [userPlayTime, historyUID];
    await con.query(sql, sqlData);
}

// 프로그램의 비디오 재생 완료 처리
async function completeProgramHistory(userPlayTime, complete, historyUID) {
    var sql = "update program_history set playTime = ?, complete = ? where UID = ?";
    const sqlData = [userPlayTime, complete, historyUID];
    await con.query(sql, sqlData);
}

// 프로그램의 비디오 재생 이력 등록
async function insertProgramHistory(userUID, videoUID, programUID, userPlayTime) {
    const complete = false;
    var sql = "insert into program_history(userUId, videoUID, programUID, playTime, complete) values(?)";
    const sqlData = [userUID, videoUID, programUID, userPlayTime, complete];
    await con.query(sql, [sqlData]);
}

module.exports = api;