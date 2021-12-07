const express = require('express');
const db = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { getError } = require('./config/requestError.js');
const { getPageInfo } = require('./config/paging.js'); 
const { addSearchSql } = require('./config/searchSql.js');
const { upload } = require('./config/uploadFile.js');
const { check } = require('express-validator');
const pageCnt15 = 15;

// cms - 프로그램 정보 조회
api.get('/',
    verifyToken,
    function (req, res) {
        var searchType = req.query.searchType ? req.query.searchType : '';
        var searchWord = req.query.searchWord ? req.query.searchWord : '';
        var status = req.query.status ? req.query.status : 'act';
        var sql = "select UID as programUID, programThumbnail, programName, programLevel, weekNumber, updateDate, status from program where UID >= 1 ";

        sql += addSearchSql(searchType, searchWord);

        var data = [];

        if (status != "all") {
            sql += "and program.status = ? ";
            data.push(status);
            data.push(status);
        }

        sql += "order by program.UID desc, program.regDate desc ";

        var currentPage = req.query.page ? parseInt(req.query.page) : '';
        if (currentPage != '') {
            var countSql = sql + ";";
            sql += "limit ?, " + pageCnt15;
            data.push(parseInt(currentPage - 1) * pageCnt15);

            db.query(countSql + sql, data, function (err, result, fields) {
                if (err) throw err;
                var {
                    startPage,
                    endPage,
                    totalPage
                } = getPageInfo(currentPage, result[0].length, pageCnt15);

                res.status(200).json({
                    status: 200,
                    data: {
                        paging: {
                            startPage: startPage,
                            endPage: endPage,
                            totalPage: totalPage
                        },
                        result: result[1]
                    },
                    message: "success"
                });
            });
        } else {
            db.query(sql, data, function (err, result, fields) {
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

// 프로그램 상세 정보 조회
api.get('/:programUID',
    verifyToken,
    function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            var programUID = req.params.programUID;
            var userUID = req.query.userUID ? req.query.userUID : 0;

            // 프로그램 정보 조회
            var sql = "select programName, programContents, programThumbnail, contentsPath, programLevel, weekNumber, status " +
                "from program left join my_program on program.UID = my_program.programUID " +
                "where program.UID = ?";
            var responseData = {};

            db.query(sql, programUID, function (err, result) {
                if (err) throw err;

                responseData = result[0];
                if (userUID != 0) {
                    // 프로그램을 신청했는지 확인
                    sql = "select UID from my_program where programUID = ? and userUID = ?";

                    var data = [programUID, userUID];

                    db.query(sql, data, function (err, result) {
                        if (err) throw err;

                        var isRegister = true;
                        if (result.length == 0)
                            isRegister = false;
                        responseData.register = isRegister;

                        res.status(200).json({
                            status: 200,
                            data: responseData,
                            message: "success"
                        });
                    });
                } else {
                    res.status(200).json({
                        status: 200,
                        data: result[0],
                        message: "success"
                    });
                }
            });
        }
    }
);

// cms - 프로그램 추가
api.post('/', 
        verifyAdminToken, 
        [
          check("pgName", "pgName is required").not().isEmpty(),
          check("pgContents", "pgContents is required").not().isEmpty(),
          check("pgLevel", "pgLevel is required").not().isEmpty(),
          check("weekNum", "weekNum is required").not().isEmpty(),
          check("status", "status is required").not().isEmpty()
        ],
        function (req, res) {
            const errors = getError(req, res);
            if(errors.isEmpty()){
                var adminUID = req.adminUID;
                var programName = req.body.pgName;
                var programContents = req.body.pgContents;
                var programLevel = req.body.pgLevel;
                var weekNumber = req.body.weekNum;
                var status = req.body.status;
                var sql = "insert program(programName, programContents, programLevel, weekNumber, status, regUID) " +
                    "values (?, ?, ?, ?, ?, ?)";
                var data = [programName, programContents, programLevel, weekNumber, status, adminUID];
                db.query(sql, data, function (err, result, fields) {
                    if (err) throw err;

                    res.status(200).json({
                        status: 200,
                        data: {
                            programUID: result.insertId
                        },
                        message: "success"
                    });
                });
            }
        }
);

// cms - 프로그램 이미지 업로드
api.put('/image/:programUID',
    verifyAdminToken,
    upload.single("img"),
    function (req, res) {
        var programUID = req.params.programUID;
        var filename = req.file.filename;
        var imgType = req.body.imgType;
        var sql = "update program set " + imgType + " = ? where UID = ?";
        var data = [filename, programUID]
        db.query(sql, data, function (err, result, fields) {
            if (err) throw err;

            res.status(200).json({
                status: 200,
                data: {
                    filename: filename
                },
                message: "success"
            });
        });
    }
);

// cms - 프로그램 활성화 여부 수정
api.put('/status/:programUID', verifyAdminToken, function (req, res) {
    var programUID = req.params.programUID;
    var status = req.body.status;
    var adminUID = req.adminUID;
    var sql = "update program set status = ?, updateUID = ? where UID = ?";
    var data = [status, adminUID, pUID];
    db.query(sql, data, function (err, result, fields) {
        if (err) throw err;

        res.status(200).send({
            status: 200,
            data: "true",
            message: "success"
        });
    });
});

// cms - 프로그램 정보 수정
api.put('/:programUID', 
        verifyAdminToken, 
        [
            check("pgName", "pgName is required").not().isEmpty(),
            check("pgContents", "pgContents is required").not().isEmpty(),
            check("pgLevel", "pgLevel is required").not().isEmpty(),
            check("weekNum", "weekNum is required").not().isEmpty(),
            check("status", "status is required").not().isEmpty()
        ],
        function (req, res) {
            const errors = getError(req, res);
            if(errors.isEmpty()){
                var adminUID = req.adminUID;
                var programUID = req.params.programUID;
                var programName = req.body.pgName;
                var programContents = req.body.pgContents;
                var programLevel = req.body.pgLevel;
                var weekNumber = req.body.weekNum;
                var status = req.body.status;
                var sql = "update program set programName = ?, programContents = ?, programLevel = ?, weekNumber = ?, status = ?, updateUID = ? where UID = ?";
                var data = [programName, programContents, programLevel, weekNumber, status, adminUID, programUID];
                db.query(sql, data, function (err, result, fields) {
                    if (err) throw err;

                    res.status(200).send({
                        status: 200,
                        data: "true",
                        message: "success"
                    });
                });
            }
});

module.exports = api;
