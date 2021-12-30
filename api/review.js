const express = require('express');
const db = require('./config/database.js');
const { getPageInfo } = require('./config/paging.js'); 
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const { addSearchSql } = require('./config/searchSql.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const pageCnt15 = 15;

// 후기 조회
api.get('/', verifyAdminToken, function (req, res) {
    var searchType = req.query.searchType ? req.query.searchType : '';
    var searchWord = req.query.searchWord ? req.query.searchWord : '';
    var sql = "select review.UID as reviewUID, review.videoUID, video.videoName, teacher.teacherName, review.userUID, user.nickName, review.reviewLevel, review.reviewPoint, " +
        "review.reviewContents, review.regDate " +
        "from review " +
        "join user on review.userUID = user.UID " +
        "join video on review.videoUID = video.UID " +
        "join teacher on video.teacherUID = teacher.UID ";

    sql += addSearchSql(searchType, searchWord);

    sql += "order by review.regDate desc";
    
    var countSql = sql + ";";

    sql += " limit ?, " + pageCnt15;
    var currentPage = req.query.page ? parseInt(req.query.page) : 1;
    var data = (parseInt(currentPage) - 1) * pageCnt15;

    db.query(countSql+sql, data, function (err, result) {
      if (err) throw err;

      var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt15);
      res.status(200).json({status:200, 
                data: {
                  paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
                  result: result[1]
                }, 
                message:"success"});
    });
});

// 후기 조회
api.get('/detail/:reviewUID', verifyAdminToken, function (req, res) {
    var reviewUID = req.params.reviewUID;
    var sql = "select review.videoUID, video.videoName, teacher.teacherName, review.userUID, user.nickName, review.reviewLevel, review.reviewPoint, review.reviewContents " +
        "from review " +
        "join user on review.userUID = user.UID " +
        "join video on review.videoUID = video.UID " +
        "join teacher on video.teacherUID = teacher.UID " +
        "where review.UID = ?";

    db.query(sql, reviewUID, function (err, result, fields) {
        if (err) throw err;

        res.status(200).json({
            status: 200,
            data: result[0],
            message: "success"
        });
    });
});

// 강사에 대한 평점 조회
// /point/:teacherUID 로 수정하고, 리뷰 조회를 /:reviewUID 로 수정하면 좋을 것 같습니다
api.get('/:teacherUID', verifyToken, function (req, res) {
    var sql = "select ifnull(round(avg(review.reviewPoint), 1), 0) as point " +
        "from review " +
        "join video on review.videoUID = video.UID " +
        "where video.teacherUID = ?";
    var data = req.params.teacherUID;

    db.query(sql, data, function (err, result, fields) {
        if (err) throw err;

        res.status(200).json({
            status: 200,
            data: result[0].point,
            message: "success"
        });
    });
});

// 운동 평가하기
api.post('/:videoUID',
    verifyToken,
    [
        check("userUID", "userUID is required").not().isEmpty(),
        check("reviewLevel", "reviewLevel is required").not().isEmpty(),
        check("reviewPoint", "reviewPoint is required").not().isEmpty(),
        check("reviewContents", "reviewContents is required").not().isEmpty()
    ],
    function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            var sql = "insert into review(videoUID, userUID, reviewLevel, reviewPoint, reviewContents) values(?, ?, ?, ?, ?)";
            var data = [req.params.videoUID, req.body.userUID, req.body.reviewLevel, req.body.reviewPoint, req.body.reviewContents];

            db.query(sql, data, function (err, result, fields) {
                if (err) throw err;

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            });
        }
    }
);

module.exports = api;
