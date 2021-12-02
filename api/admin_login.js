const express = require('express');
const db = require('./config/database.js');
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
    function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            var email = req.body.email;
            var password = req.body.password;

            var existSql = "select UID from admin where email=?";
            db.query(existSql, email, function (err, result) {
                if (err) throw err;

                if (result.length == 0)
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "가입된 계정이 아니에요!"
                    });
                else {
                    var sql = "select * from admin where email=? and password=?";
                    var data = [email, sha256(password)];
                    var adminUID = 0;
                    var token = '';

                    db.query(sql, data, function (err, result) {
                        if (err) throw err;

                        if (!result[0]) {
                            res.status(403).send({
                                status: 403,
                                data: [],
                                message: "비밀번호가 맞지 않아요!"
                            });
                        } else {
                            adminUID = result[0].UID;
                            var name = result[0].name;
                            var department = result[0].department;

                            token = jwt.sign({
                                    adminUID: adminUID,
                                    auth: "admin"
                                },
                                secretObj.secret, // 비밀 키
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

                            var token_sql = "insert admin_log(adminUID, token) values (?, ?)";
                            var token_data = [adminUID, token];
                            db.query(token_sql, token_data, function (err, result) {
                                if (err) throw err;
                            });
                        }
                    });

                }
            });

        }
    }
);

module.exports = api;