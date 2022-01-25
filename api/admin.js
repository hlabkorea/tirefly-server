const express = require('express');
const sha256 = require('sha256');
const { con } = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const { verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// cms - 관리자 상세정보 조회
api.get('/:adminUID',
    verifyAdminToken,
    async function (req, res) {
        try{
            const adminUID = req.params.adminUID;
            var sql = "select name, email, department, imgPath from admin where UID = ?";
            const [result] = await con.query(sql, adminUID);
            res.status(200).json({
                status: 200,
                data: result[0],
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 관리자 회원가입
/*api.post('/',
    [
        check("email", "email is required").not().isEmpty(),
        check("passwd", "passwd is required").not().isEmpty(),
        check("name", "name is required").not().isEmpty(),
        check("department", "department is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const email = req.body.email;
                const passwd = sha256(req.body.passwd);
                const name = req.body.name;
                const department = req.body.department;

                // 관리자 생성
                var sql = "insert into admin(email, password, name, department) " +
                    "values (?)";
                const sqlData = [email, passwd, name, department];
                const [result] = await con.query(sql, [sqlData]);

                const adminUID = result.insertId;

                const token = jwt.sign({
                        adminUID: adminUID, // 토큰의 내용(payload)
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

                // 토큰 이력 추가
                var tokenSql = "insert admin_log(adminUID, token) values(?)";
                const tokenData = [adminUID, token];
                con.query(tokenSql, [tokenData]);
            } catch (err) {
                throw err;
            }
        }
    }
);*/

// cms - 비밀번호 변경
api.put('/password',
    verifyAdminToken,
    [
        check("password", "password is required").not().isEmpty(),
        check("newPasswd", "newPasswd is required").not().isEmpty()
    ], 
    async function (req, res) {
        const errors = getError(req, res);
		if(errors.isEmpty()){
            try{
                const adminUID = req.adminUID;
                const password = sha256(req.body.password);
                const newPasswd = sha256(req.body.newPasswd);

                // 현재 비밀번호 조회
                const curPasswd = await selectAdminPassword(adminUID);

                if (password != curPasswd){ // 비밀번호 불일치
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "기존 비밀번호가 틀렸습니다."
                    });

                    return false;
                }
                else if (newPasswd == curPasswd){ // 기존 비밀번호와 동일
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "기존 비밀번호와 동일합니다."
                    });

                    return false;
                }

                await updateAdminPassword(newPasswd, adminUID);

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "변경되었습니다."
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// cms - 프로필 이미지 변경
api.put('/image/:adminUID',
    verifyAdminToken,
    upload.single("img"),
    async function (req, res) {
        try{
            const adminUID = req.params.adminUID;
            const filename = req.file.filename;
            var sql = "update admin set imgPath = ? where UID = ?";
            const data = [filename, adminUID];
            await con.query(sql, data);
            res.status(200).json({
                status: 200,
                data: {
                    filename: filename
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }   
    }
);

// 현재 관리자의 비밀번호 조회
async function selectAdminPassword(adminUID){
    var sql = "select password from admin where UID = ?";
    const [result] = await con.query(sql, adminUID);
    return result[0].password;
}

// 관리자 비밀번호 변경
async function updateAdminPassword(password, adminUID){
    var sql = "update admin set password= ? where UID = ?";
    const sqlData = [password, adminUID];
    await con.query(sql, sqlData);
}

module.exports = api;