const express = require('express');
const sha256 = require('sha256');
const db = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const { verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 관리자 상세정보 조회
api.get('/:adminUID',
    verifyAdminToken,
    function (req, res) {
        var adminUID = req.params.adminUID;
        var sql = "select name, email, department, imgPath from admin where UID = ?";
        db.query(sql, adminUID, function (err, result) {
            if (err) throw err;

            res.status(200).json({
                status: 200,
                data: result[0],
                message: "success"
            });
        });
    }
);

// 관리자 계정 회원가입
api.post('/join',
    [
        check("email", "email is required").not().isEmpty(),
        check("passwd", "passwd is required").not().isEmpty(),
        check("name", "name is required").not().isEmpty(),
        check("department", "department is required").not().isEmpty()
    ], 
    function (req, res) {
        const errors = getError(req, res);
		if(errors.isEmpty()){
            var sql = "insert into admin(email, password, name, department) " +
                "values (?, ?, ?, ?)";
            var email = req.body.email;
            var passwd = sha256(req.body.password);
            var name = req.body.name;
            var department = req.body.department;
            var data = [email, passwd, name, department];

            db.query(sql, data, function (err, result) {
                if (err) throw err;

                var adminUID = result.insertId;

                var token = jwt.sign({
                        adminUID: adminUID, // 토큰의 내용(payload)
                    },
                    secretObj.secret, // 비밀 키
                    {
                        expiresIn: '1440m' // 유효 시간은 1440분
                    });

                // 토큰 이력 추가
                var token_check_sql = "select token from admin_log where adminUID = ? " +
                    "order by regDate desc " +
                    "limit 1";

                db.query(token_check_sql, adminUID, function (err, result, fields) {
                    if (err) throw err;

                    if (token != result[0]) {
                        var token_insert_sql = "insert into user_log(adminUID, token) values(?, ?)";
                        var token_insert_data = [adminUID, token];
                        db.query(token_insert_sql, token_insert_data, function (err, result) {
                            if (err) throw err;
                        });
                    }
                });

                res.status(200).json({
                    status: 200,
                    data: {
                        UID: adminUID,
                        token: token
                    },
                    message: "success"
                });
            });
        }
    }
);

// 관리자 계정 비밀번호 변경
api.put('/password',
    verifyAdminToken,
    [
        check("password", "password is required").not().isEmpty(),
        check("newPasswd", "newPasswd is required").not().isEmpty()
    ], 
    function (req, res) {
        const errors = getError(req, res);
		if(errors.isEmpty()){
            var adminUID = req.adminUID;
            var sql = "select password from admin where UID = ?";
            db.query(sql, adminUID, function (err, result) {
                if (err) throw err;

                var password = sha256(req.body.password);
                var newPasswd = sha256(req.body.newPasswd);
                var adminPasswd = result[0].password;
                if (password != adminPasswd)
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "기존 비밀번호가 틀렸습니다."
                    });
                else if (newPasswd == adminPasswd)
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "기존 비밀번호와 동일합니다."
                    });
                else {
                    var update_sql = "update admin set password= ? where UID = ?";
                    var data = [newPasswd, adminUID];
                    const exec2 = db.query(update_sql, data, function (err, result) {
                        if (err) throw err;

                        res.status(200).json({
                            status: 200,
                            data: "true",
                            message: "변경되었습니다."
                        });
                    });
                    console.log(exec2.sql);
                }
            });
        }
    }
);

// cms - 관리자 프로필 이미지 변경
api.put('/image/:adminUID',
    verifyAdminToken,
    upload.single("img"),
    function (req, res) {
        var adminUID = req.params.adminUID;
        var filename = req.file.filename;
        var sql = "update admin set imgPath = ? where UID = ?";
        var data = [filename, adminUID];
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

module.exports = api;