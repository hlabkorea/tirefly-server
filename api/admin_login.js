const express = require('express');
const { con } = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const api = express.Router();
const sha256 = require('sha256');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// cms - 로그인
api.post('/',
    [
        check("email", "email is required").not().isEmpty(),
        check("password", "password is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const email = req.body.email;
                const password = sha256(req.body.password);

                if(await isExistEmail(email) == false){
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "가입된 계정이 아니에요!"
                    });

                    return false;
                }

                const result = await getAdminLoginResult(email, password);
                if(result.length == 0){
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "비밀번호가 맞지 않아요!"
                    });

                    return false;
                }

                const adminUID = result[0].UID;
                const name = result[0].name;
                const department = result[0].department;

                const token = makeAdminJWT(adminUID);

                res.status(200).send({
                    status: 200,
                    data: {
                        UID: adminUID,
                        name: name,
                        department: department,
                        token: token
                    }
                });

                insertAdminLog(adminUID, token);
            } catch (err) {
                throw err;
            }
        }
    }
);

// 이메일 가입 여부 확인
async function isExistEmail(email){
    var sql = "select UID from admin where email = ?";
    const sqlData = [email];
    const [result] = await con.query(sql, sqlData);

    if(result.length != 0)
        return true;
    else    
        return false;
}

// 비밀번호 확인 & 관리저 정보 반환
async function getAdminLoginResult(email, password){
    var sql = "select * from admin where email = ? and password = ?";
    const sqlData = [email, password];
    const [result] = await con.query(sql, sqlData);
    return result;
}

// 관리자 JWT 생성
function makeAdminJWT(adminUID){
    return token = jwt.sign({
        adminUID: adminUID,
        auth: "admin"
    },
    secretObj.secret,
    {
        expiresIn: '1440m' // 유효 시간은 1440분
    });
}

// 관리자 로그 추가
function insertAdminLog(adminUID, token){
    var sql = "insert admin_log(adminUID, token) values (?, ?)";
    var sqlData = [adminUID, token];
    con.query(sql, sqlData);
}

module.exports = api;