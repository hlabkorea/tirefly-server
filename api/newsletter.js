const express = require('express');
const { con } = require('./config/database.js');
const api = express.Router();
const { check } = require('express-validator');
const {getError} = require('./config/requestError.js');

// 뉴스레터 구독 등록
api.post('/',
    [
        check("email", "email is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const email = req.body.email;
                const letterUID = await selectLetterUID(email); // 구독자인지 확인하기 위해 구독 UID 조회

                if (letterUID != 0) { // 구독자인 경우
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "이미 구독한 사용자입니다."
                    }); // 멘트 수정
                    return false;
                }

                await insertNewsletter(email); // 뉴스레터 구독자 등록

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "구독하였습니다."
                }); // 멘트 수정
            } catch (err) {
                throw err;
            }
        }
    }
);

// 구독 UID 조회
async function selectLetterUID(email) {
    var sql = "select UID from newsletter where email = ?";
    const [result] = await con.query(sql, email);
    if (result.length != 0)
        return result[0].UID;
    else
        return 0;
}

// 구독 등록
async function insertNewsletter(email) {
    var sql = "insert newsletter(email) values (?)";
    await con.query(sql, email);
}

module.exports = api;