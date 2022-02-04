const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 프로그램 참여하기 리스트 조회
api.get('/all', verifyToken, async function (req, res) {
    try{
        var sql = "select a.programUID, b.programName, b.programThumbnail, b.weekNumber, b.programLevel,  count(a.UID) as totalCount " +
            "from program_list a " +
            "join program b on a.programUID = b.UID " +
            "where b.status = 'act' " +
            "group by a.programUID " +
            "order by b.regDate desc";
        const [result] = await con.query(sql);
        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// n주차 비디오 목록
api.get('/week/:programUID',
    verifyToken,
    [
        check("weekly", "weekly is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const programUID = req.params.programUID;
                const weekly = req.query.weekly;
                var sql = "select ifnull(b.UID, 0) as videoUID, a.day, a.isRest, ifnull(b.contentsPath, '') as teacherImg, ifnull(b.contentsPath, '') as contentsPath, " +
                    "ifnull(b.videoName, '') as videoName, ifnull(d.teacherName, '') as teacherName, ifnull(c.categoryName, '') as categoryName, " +
                    "ifnull(b.videoLevel, '') as videoLevel, ifnull(b.playTimeValue, '') as playTimeValue " +
                    "from program_list a " +
                    "left join video b on a.videoUID = b.UID " +
                    "left join category c on b.categoryUID = c.UID " +
                    "left join teacher d on b.teacherUID = d.UID " +
                    "where a.programUID = ? and a.weekly = ? " +
                    "order by a.day";
                const sqlData = [programUID, weekly];
                const [result] = await con.query(sql, sqlData);

                res.status(200).json({
                    status: 200,
                    data: result,
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// 프로그램에서 완료한 비디오 조회
api.get('/complete/:programUID',
    verifyToken,
    [
        check("weekly", "weekly is required").not().isEmpty(),
        check("userUID", "userUID is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const programUID = req.params.programUID;
                const userUID = req.query.userUID;
                const weekly = req.query.weekly;

                var sql = "select a.videoUID, b.complete " + // 완료한 비디오를 조회하는 것이므로 complete 파라미터는 필요하지 않음
                    "from program_list a " +
                    "join program_history b on a.programUID = b.programUID and a.videoUID = b.videoUID " +
                    "where a.programUID = ? and b.userUID = ? and a.weekly = ? and b.complete = 1 " +
                    "group by b.UID " +
                    "order by a.day";
                const sqlData = [programUID, userUID, weekly];
                const [result] = await con.query(sql, sqlData);

                res.status(200).json({
                    status: 200,
                    data: result,
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// 프로그램의 비디오 목록 조회
api.get('/:programUID',
    verifyAdminToken,
    async function (req, res) {
        try{
            const programUID = req.params.programUID;
            var sql = "select videoUID, weekly, day, isRest from program_list where programUID = ?";
            const [result] = await con.query(sql, programUID);

            res.status(200).json({
                status: 200,
                data: result,
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// cms - 프로그램의 비디오 목록 등록
api.put('/:programUID',
    verifyAdminToken,
    async function (req, res) {
        try{
            const adminUID = req.adminUID;
            const programUID = req.params.programUID;
            const programList = req.body.programList;

            const listUIDs = await selectProgramListUIDs(programUID); // 비디오 목록 조회
            if(listUIDs.length != 0) // 이미 program에 대한 비디오 목록이 존재하면 삭제
                await deleteProgramList(listUIDs)
            
            const sqlListData = makeSqlListData(programUID, adminUID, programList); // sql data로 넣기 위해 데이터 가공
            await insertProgramList(sqlListData); // 비디오 목록 등록

            res.status(200).json({
                status: 200,
                data: "true",
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 프로그램의 비디오 목록 UID 조회
async function selectProgramListUIDs(programUID){
    var sql = "select UID from program_list where programUID = ?";
    const [result] = await con.query(sql, programUID);
    var UIDs = [];
    if(result.length != 0){
        for(var i in result)
            UIDs.push(result[i].UID);
    }

    return UIDs;
}

// 프로그램의 비디오 목록 삭제
async function deleteProgramList(listUIDs){
    var sql = "delete from program_list where UID in (?);";
    await con.query(sql, [listUIDs]);
}

// 프로그램의 비디오 목록 sql data 생성
function makeSqlListData(programUID, adminUID, programList){
    var result = [];

    for (var i in programList) {
        var videoUID = programList[i].videoUID;
        var day = programList[i].day;
        var weekly = programList[i].weekly;
        var isRest = programList[i].isRest;
        result.push([programUID, videoUID, weekly, day, isRest, adminUID]);
    }

    return result;
}

// 프로그램의 비디오 목록 등록
async function insertProgramList(sqlListData){
    if(sqlListData.length != 0){
        var sql = "insert program_list(programUID, videoUID, weekly, day, isRest, regUID) values ?;";
        await con.query(sql, [sqlListData]);
    }
}

module.exports = api;
