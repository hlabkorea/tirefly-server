const express = require('express');
const db = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 강사에 대한 평점 조회
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
