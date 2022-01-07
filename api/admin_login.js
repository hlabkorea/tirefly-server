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

                // 이메일 가입 확인
                var existSql = "select UID from admin where email = ?";
                const existData = [email];
                const [existRes] = await con.query(existSql, existData);
                if(existRes.length == 0){
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "가입된 계정이 아니에요!"
                    });

                    return false;
                }

                // 비밀번호 확인
                var loginSql = `select * from admin where email = '${email}' and password = '${password}'`
                const [loginRes] = await con.query(loginSql);
                if(loginRes.length == 0){
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "비밀번호가 맞지 않아요!"
                    });

                    return false;
                }

                /*
                var loginSql = "select * from admin where email = ? and password = ?";
                var loginData = [email, password];
                const [loginRes] = await con.query(loginSql, loginData);
                if(loginRes.length == 0){
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "비밀번호가 맞지 않아요!"
                    });

                    return false;
                }
                */

                // 토큰 발급
                const adminUID = loginRes[0].UID;
                const name = loginRes[0].name;
                const department = loginRes[0].department;

                const token = jwt.sign({
                        adminUID: adminUID,
                        auth: "admin"
                    },
                    secretObj.secret,
                    {
                        expiresIn: '1440m' // 유효 시간은 1440분
                    });

                res.status(200).send({
                    status: 200,
                    data: {
                        UID: adminUID,
                        name: name,
                        department: department,
                        token: token
                    }
                });

                // admin_log 에 로그 추가
                var tokenSql = `insert admin_log(adminUID, token) values (${adminUID}, '${token}')`;
                con.query(tokenSql);
            } catch (err) {
                throw err;
            }
        }
    }
);

module.exports = api;