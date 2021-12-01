const express = require('express');
const db = require('./config/database.js');
const api = express.Router();
const { check } = require('express-validator');
const {getError} = require('./config/requestError.js');

// 뉴스레터 구독 추가
api.post('/',
    [
        check("email", "email is required").not().isEmpty()
    ],
    function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            var email = req.body.email;
            var selectSql = "select UID from newsletter where email = ?";
            db.query(selectSql, email, function (err, result) {
                if (err) throw err;

                if (result.length != 0)
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "이미 구독한 사용자입니다."
                    }); // 멘트 수정
                else {
                    var insertSql = "insert newsletter(email) values (?)";

                    db.query(insertSql, email, function (err, result) {
                        if (err) throw err;

                        res.status(200).json({
                            status: 200,
                            data: "true",
                            message: "구독하였습니다."
                        }); // 멘트 수정
                    });
                }
            });
        }
    }
);

module.exports = api;