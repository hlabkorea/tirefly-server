const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 프로그램 신청하기 / 취소하기 (기존데이터 삭제후 새로운 데이터 삽입)
api.put('/:programUID',
    verifyToken,
    [
        check("userUID", "userUID is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const programUID = req.params.programUID;
                const userUID = req.body.userUID;

                const myProgramUID = await selectMyProgramUID(userUID, programUID);
                var message = "";

                if (myProgramUID > 0) { // 신청할 프로그램인 경우
                    await deleteMyProgram(myProgramUID);
                    const historyUIDs = await getHistoryUIDs(userUID, programUID);
                    await deleteHistory(historyUIDs);
                    message = "프로그램이 취소되었습니다.";
                } else { // 신청한 프로그램이 아닐 경우
                    await inseryMyProgram(userUID, programUID);
                    message = "프로그램이 시작되었습니다.";
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

// 나의 프로그램 목록의 UID 조회
async function selectMyProgramUID(userUID, programUID) {
    var sql = "select UID from my_program where userUID = ? and programUID = ?";
    const sqlData = [userUID, programUID];
    const [result] = await con.query(sql, sqlData);

    if (result.length != 0)
        return result[0].UID;
    else
        return 0;
}

// 나의 프로그램에서 삭제
async function deleteMyProgram(myProgramUID) {
    var sql = "delete from my_program where UID = ?";
    await con.query(sql, myProgramUID);
}

// 프로그램 재생 이력의 UID 조회
async function getHistoryUIDs(userUID, programUID) {
    var sql = "select UID from program_history where userUID = ? and programUID = ?";
    const sqlData = [userUID, programUID];
    const [result] = await con.query(sql, sqlData);

    var historyUIDs = [];
    for (var i in result)
        historyUIDs.push(result[i].UID);

    return historyUIDs;
}

// 프로그램 재생 이력에서 삭제
async function deleteHistory(historyUIDs) {
    if (historyUIDs.length != 0) {
        var sql = "delete from program_history where UID in (?)";
        await con.query(sql, historyUIDs);
    }
}

// 나의 프로그램 등록
async function inseryMyProgram(userUID, programUID) {
    var sql = "insert into my_program(userUID, programUID) values(?, ?)";
    const sqlData = [userUID, programUID];
    await con.query(sql, sqlData);
}

module.exports = api;