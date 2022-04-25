const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const jwt = require("jsonwebtoken");
const { getError } = require('./config/requestError.js');
const { con2, con } = require('./config/database.js');
const secretObj = require("./config/jwt.js");
const sha256 = require('sha256');
const { sendJoinMail, sendCertifyNoMail } = require('./config/mail.js');
const { verifyToken } = require("./config/authCheck.js");
const { compile } = require('ejs');

//인증메일전송 (이메일 중복 확인 , 인증번호 생성 , 인증번호 메일 발송)
api.post('/certify',
    [
        check("email", "email is required").not().isEmpty(),
        check("certifyType", "certifyType is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            const email = req.body.email
            const certifyType = req.body.certifyType
            if (certifyType == "join") {

                var sql = "select * from user where email = ?"
                const [result] = await con.query(sql, email);
    
                if(result.length > 0)
                    res.status(403).json({
                        status: 403,
                        data : "false",
                        message : "이미 가입된 이메일입니다."
                    });
                
            } else {
                
                const certifyNo = randomNo();
                const returnData = await insertCertify(email, certifyNo, type);

                sendCertifyNoMail(email, certifyNo)

                res.status(200).json({
                    status: 200,
                    data : certifyNo,
                    message : "인증번호가 발송 되었습니다."
                })
            }
        }
    }
)


//회원가입
api.post('/join',
    [
        check("email", "email is required").not().isEmpty(),
        check("password", "password is required").not().isEmpty(),
        check("certifyNo", "certifyNo is required").not().isEmpty(),
    ],
    async function (req, res) {
        const errors = getError(req, res);

        if (errors.isEmpty()) {
            const email = req.body.email
            const password = sha256(req.body.password)
            const certifyNo = req.body.certifyNo
            const recommend = req.body.recommend

            //인증키 확인
            var sql = "select * from certify where email = ? and certifyNo = ?"
            const sqlData = [email, certifyNo];
            const [certifyCheck] = await con.query(sql, sqlData);


            if(certifyCheck.length == 0){
                res.status(403).json({
                    status : 403,
                    data : "false",
                    message : "인증에 실패하였습니다. 인증번호를 다시 확인하십시오."
                })
            } else {

                // 추천인 검증
                var rcmndSql = "select email from user where email = ?"
                const [rcmndCheck] = await con.query(sql, recommend);

                if(rcmndCheck.length == 0) {
                    res.status(403).json({
                        status : 403,
                        data : "false",
                        message : "존재 하지 않는 추천인입니다."
                    })
                }

                // 중복회원 검증

                const overlapEmail = await overlapEmail(email)
                if(overlapEmail.length > 0) {
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "이미 등록된 이메일주소 입니다."
                    });
                } else {
                    //회원가입 진행
                    const userUID = await insertUser(email, password, recommend)


                    const token = makeJWT(userUID)
                    insertUserLog(userUID, token);
                    const mail = sendJoinMail(email);


                    res.status(200).json({
                        status: 200,
                        data: {
                            UID : userUID,
                            email : email,
                            token : token,
                        },
                        message : "success"
                    })
                }
            }
        }
    }
);

// 비밀번호 변경
api.put('/password',
    [
        check("email", "email is required").not().isEmpty(),
        check("password", "password is required").not().isEmpty(),
        check("certifyNo", "certifyNo").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const email = req.body.email;
                const password = sha256(req.body.password);
                const certifyNo = req.body.certifyNo;

                            //인증키 확인
                var sql = "select * from certify where email = ? and certifyNo = ?"
                const sqlData = [email, certifyNo];
                const [certifyCheck] = await con.query(sql, sqlData);


                if(certifyCheck.length == 0){
                    res.status(403).json({
                        status : 403,
                        data : "false",
                        message : "인증에 실패하였습니다. 인증번호를 다시 확인하십시오."
                    })
                } else {
                    await updatePasswd(email, password);
                    await pwToken(email);
    
                    res.status(200).json({
                        status: 200,
                        data: "true",
                        message: "비밀번호가 변경되었습니다."
                    });
                }

            } catch (err) {
                console.log(err)
                throw err;
            }
        }
    }
);


// 회원 탈퇴
api.delete('/:userUID',
    verifyToken,
    async function (req, res) {
        const errors = getError(req, res);
        if(errors.isEmpty()){
            var userUID = req.params.userUID;
            //토큰 추가

            var sql = "update user set stts = 0, email = '', password = '' where UID = ?"
            var sqlData = [userUID]
            await con.query(sql, sqlData);

            console.log("hererrrr");

            res.status(200).json({
                status: 200,
                data : "true",
                message : "success"
            })
        }
    }
);

//랜덤 인증 번호 생성
function randomNo() {
    let str = ''
    for(let i = 0; i < 6; i++){
        str += Math.floor(Math.random() * 6)
    }
    return str
}

// 인증 번호 추가
async function insertCertify (email, certifyNo) {
    const regDate = new Date();
    var sql = "insert into certify(email, certifyNo, regDate) values (?, ?, ?)"
    const sqlData = [email, certifyNo, regDate];
    const [result] = await con.query(sql, sqlData);
    return result;
}

// 중복 회원 확인
async function overlapEmail (email) {
    var sql = "select * from user where email = ?"
    const [result] = await con.query(sql, email);
    return result;
}

// 회원 추가
async function insertUser (email, password, recommend) {
    const regDate = new Date();
    var sql = "insert into user(email , password, rcmnd, regDate) values (?, ?, ?, ?)"
    const sqlData = [email, password, recommend, regDate]
    const [result] = await con.query(sql, sqlData)
    return result.insertId;
}


// 유저 사용이력 추가
function insertUserLog(userUID, token) {
    const regDate = new Date();
    var sql = "insert into user_log(userUID, token, regDate) values(?, ?, ?)";
    const sqlData = [userUID, token, regDate];
    con.query(sql, sqlData);
}


// 비밀번호 변경
async function updatePasswd(email, password) {
    var sql = "update user set password = ? where email = ?";
    const sqlData = [password, email];
    await con.query(sql, sqlData);
}

// 비밀번호 변경 이력 저장
async function pwToken(email) {
	var sql = "select UID from user where email = ?";
	const [userResult] = await con.query(sql, email);

	var userUID = userResult[0].UID;

    sql = "insert into user_log(userUID, token) values (?, ?)";
	const sqlData = [userUID, "password change"];
    const [result] = await con.query(sql, sqlData);
}


function makeJWT(userUID) {
    var token = jwt.sign({
            userUID: userUID,
        },
        secretObj.secret, // 비밀 키
        {
            expiresIn: '30d'
            //expiresIn: '1440m'    // 유효 시간은 1440분
        });

    return token;
}

module.exports = api;