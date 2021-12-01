const express = require('express');
const db = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 프로그램 참여하기 리스트 조회
api.get('/all', verifyToken, function (req, res) {
    var sql = "select program_list.programUID, program.programName, program.programThumbnail, program.weekNumber, program.programLevel,  count(program_list.UID) as totalCount " +
        "from program_list " +
        "join program on program_list.programUID = program.UID " +
        "group by program_list.programUID " +
        "order by program.regDate desc";

    db.query(sql, function (err, result) {
        if (err) throw err;

        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

// n주차 비디오 목록
api.get('/week/:programUID',
    verifyToken,
    [
        check("weekly", "weekly is required").not().isEmpty()
    ],
    function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            var programUID = req.params.programUID;
            var weekly = req.query.weekly;
            var sql = "select ifnull(video.UID, 0) as videoUID, program_list.day, program_list.isRest, ifnull(teacher.teacherImg, '') as teacherImg, ifnull(video.contentsPath, '') as contentsPath, " +
                "ifnull(video.videoName, '') as videoName, ifnull(teacher.teacherName, '') as teacherName, ifnull(category.categoryName, '') as categoryName, " +
                "ifnull(video.videoLevel, '') as videoLevel, ifnull(video.playTimeValue, '') as playTimeValue " +
                "from program_list " +
                "left join video on program_list.videoUID = video.UID " +
                "left join category on video.categoryUID = category.UID " +
                "left join teacher on video.teacherUID = teacher.UID " +
                "where program_list.programUID = ? and weekly = ? " +
                "order by program_list.day";

            var data = [programUID, weekly];

            db.query(sql, data, function (err, result) {
                if (err) throw err;

                for (var i in result) {
                    result[i].teacherImg = result[i].contentsPath;
                }

                res.status(200).json({
                    status: 200,
                    data: result,
                    message: "success"
                });
            });
        }
    }
);

// 프로그램의 비디오 완료 여부 조회
api.get('/complete/:programUID',
    verifyToken,
    [
        check("weekly", "weekly is required").not().isEmpty(),
        check("userUID", "userUID is required").not().isEmpty()
    ],
    function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            var programUID = req.params.programUID;
            var userUID = req.query.userUID;
            var weekly = req.query.weekly;

            var sql = "select program_list.videoUID, program_history.complete " +
                "from program_list " +
                "join program_history on program_list.programUID = program_history.programUID and program_list.videoUID = program_history.videoUID " +
                "where program_list.programUID = ? and program_history.userUID = ? and weekly = ? " +
                "group by program_history.UID " +
                "order by program_list.day";

            var data = [programUID, userUID, weekly];

            db.query(sql, data, function (err, result) {
                if (err) throw err;

                res.status(200).json({
                    status: 200,
                    data: result,
                    message: "success"
                });
            });
        }
    }
);

// cms - 프로그램 리스트 추가
api.put('/:programUID',
    verifyAdminToken,
    function (req, res) {
        var adminUID = req.adminUID;
        var programUID = req.params.programUID;
        var programList = req.body.programList;

        var selectSql = "select UID from program_list where programUID = ?";
        db.query(selectSql, programUID, function (err, selectResult, fields) {
            if (err) throw err;

            // 이미 program에 대한 리스트가 존재하면 삭제
            if (selectResult.length != 0) {
                var deleteData = [];
                for (var i in selectResult) {
                    deleteData.push(selectResult[i].UID);
                }

                var deleteSql = "delete from program_list where UID in (?);";
                db.query(deleteSql, [deleteData], function (err, selectResult, fields) {
                    if (err) throw err;
                });
            }
            var data = [];
            for (var i in programList) {
                var weekly = programList[i].weekly;
                var programData = programList[i].data;
                for (var j in programData) {
                    var videoUID = programData[j].videoUID;
                    var day = programData[j].day;
                    var isRest = programData[j].isRest;
                    data.push([programUID, videoUID, weekly, day, isRest, adminUID]);
                }
            }

            var sql = "insert program_list(programUID, videoUID, weekly, day, isRest, regUID) values ?;";
            db.query(sql, [data], function (err, result, fields) {
                if (err) throw err;

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            });
        });
    }
);

module.exports = api;
