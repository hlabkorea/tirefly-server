const express = require('express');
const { con } = require('./config/database.js');
const { getPageInfo } = require('./config/paging.js'); 
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const e = require('express');
const pageCnt15 = 15;

// 강사 평점을 조회하는 /:teacherUID를 /teacher/:teacherUID 로 수정하고, 리뷰를 조회하는 /detail/:reviewUID를 /:reviewUID 로 수정해야합니다

// 후기 전체 조회
api.get('/', verifyAdminToken, async function (req, res) {
    try {
        const searchType = req.query.searchType ? req.query.searchType : '';
        const searchWord = req.query.searchWord ? req.query.searchWord : '';
        const currentPage = req.query.page ? parseInt(req.query.page) : 1;
        var sql = "select a.UID as reviewUID, a.videoUID, c.videoName, d.teacherName, a.userUID, b.nickName, a.reviewLevel, a.reviewPoint, " +
            "a.reviewContents, a.regDate " +
            "from review a " +
            "join user b on a.userUID = b.UID " +
            "join video c on a.videoUID = c.UID " +
            "join teacher d on c.teacherUID = d.UID ";

        if (searchType.length != 0){ // 검색
            if (searchType == "videoName") 
                sql += "and c.videoName ";
            else if (searchType == "teacherName")
                sql += "and d.teacherName ";
    
            sql += `LIKE '%${searchWord}%' `;
        }

        sql += "order by a.regDate desc ";

        var countSql = sql + ";";
        const offset = (parseInt(currentPage) - 1) * pageCnt15;
        sql += `limit ${offset}, ${pageCnt15}`;

        const [result] = await con.query(countSql + sql);

        const {
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
    } catch (err) {
        throw err;
    }
});

// 후기 상세조회
api.get('/detail/:reviewUID', verifyAdminToken, async function (req, res) {
    try{
        const reviewUID = req.params.reviewUID;
        var sql = "select a.videoUID, c.videoName, d.teacherName, a.userUID, b.nickName, a.reviewLevel, a.reviewPoint, a.reviewContents, a.regDate " +
            "from review a " +
            "join user b on a.userUID = b.UID " +
            "join video c on a.videoUID = c.UID " +
            "join teacher d on c.teacherUID = d.UID " +
            "where a.UID = ?";
        const [result] = await con.query(sql, reviewUID);
        res.status(200).json({
            status: 200,
            data: result[0],
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 강사에 대한 평점 조회
api.get('/:teacherUID', verifyToken, async function (req, res) {
    try{
        const teacherUID = req.params.teacherUID;
        var sql = "select ifnull(round(avg(a.reviewPoint), 1), 0) as point " +
            "from review a " +
            "join video b on a.videoUID = b.UID " +
            "where b.teacherUID = ?";
        const [[result]] = await con.query(sql, teacherUID);

        res.status(200).json({
            status: 200,
            data: parseFloat(result.point),
            message: "success"
        });
    } catch (err) {
        throw err;
    }
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
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const videoUID = req.params.videoUID;
                const userUID = req.body.userUID;
                const reviewLevel = req.body.reviewLevel;
                const reviewPoint = req.body.reviewPoint;
                const reviewContents = req.body.reviewContents;
                var sql = "insert into review(videoUID, userUID, reviewLevel, reviewPoint, reviewContents) values(?)";
                const sqlData = [videoUID, userUID, reviewLevel, reviewPoint, reviewContents];
                await con.query(sql, [sqlData]);

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

module.exports = api;
