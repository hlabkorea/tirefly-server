const express = require('express');
const { con } = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const api = express.Router();
const sha256 = require('sha256');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 로그인
api.post('/',
    [
        check("email", "email is required").not().isEmpty(),
        check("password", "password is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const email = req.body.email;
                const password = sha256(req.body.password);

                console.log("email : " , email);
                console.log("password : ", password);

                // 비밀번호 확인
                const loginRes = await getLoginResult(email, password);

                console.log("return : " , loginRes)
                if (loginRes.length == 0) { // 비밀번호 불일치
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "계정정보가 일치하지 않습니다."
                    });

                    return false;
                }

                const userUID = loginRes[0].UID;

                console.log("userUID : ", userUID)


                // jwt 토큰 생성
                const token = makeJWT(userUID);


                console.log("tokenResult : ", token);

                res.status(200).send({
                    status: 200,
                    data: {
                        UID: userUID,
                        email: email,
                        token: token,
                    }
                });

                // 토큰 이력 추가
                insertUserLog(userUID, token);
            } catch (err) {
                console.log("login Err : ",err);
                throw err;
            }
        }
    }
);


// 비밀번호 일치 여부 확인
async function getLoginResult(email, password) {
    var sql = "select UID from user where email = ? and password = ? and stts = 1";
    const sqlData = [email, password];
    const [result] = await con.query(sql, sqlData);

    return result;
}

// 사용자 로그인 이력 추가
function insertUserLog(userUID, token) {
    const regDate = new Date();
    var sql = "insert into user_log(userUID, token, regDate) values(?, ?, ?)";
    const sqlData = [userUID, token, regDate];
    con.query(sql, sqlData);
}

// jwt 생성
function makeJWT(userUID) {
    var token = jwt.sign({
            userUID: userUID,
        },
        secretObj.secret, // 비밀 키
        {
            expiresIn: '1440m'    // 유효 시간은 1440분
        });

    return token;
}


module.exports = api;