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

                // 비밀번호 확인
                const loginRes = await getLoginResult(email, password);
                if (loginRes.length == 0) { // 비밀번호 불일치
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "비밀번호가 맞지 않아요!"
                    });

                    return false;
                }

                const userUID = loginRes[0].UID;
                const redirect = getRedirectPage(loginRes);

                // 멤버십 소유자인지 확인
                const membershipRes = await selectMembership(userUID);
                var level = membershipRes.level;
                var endDate = membershipRes.endDate;

                if (level == "normal") {
                    // 멤버십 초대자인지 확인
                    const membershipGroupRes = await selectMembershipGroup(userUID);
                    level = membershipGroupRes.level;
                    endDate = membershipGroupRes.endDate;
                }

                // jwt 토큰 생성
                const token = makeJWT(userUID, level);

                res.status(200).send({
                    status: 200,
                    data: {
                        UID: userUID,
                        email: email,
                        token: token,
                        redirect: redirect,
                        auth: level,
                        endDate: endDate
                    }
                });

                // 토큰 이력 추가
                insertUserLog(userUID, token);
            } catch (err) {
                throw err;
            }
        }
    }
);

// 비밀번호 일치 여부 확인
async function getLoginResult(email, password) {
    var sql = "select UID, status, nickName from user where email = ? and password = ? and status != 'delete'";
    const sqlData = [email, password];
    const [result] = await con.query(sql, sqlData);

    return result;
}

// redirect 페이지 조회
function getRedirectPage(result){
    if (result[0].status == "sleep") // 휴면 페이지
        return "sleep";
    else if (result[0].nickName.length > 0) // vod 메인 페이지
        return "contents";
    else // 세팅 정보 페이지
        return "setting";
}

// 멤버십 소유자인지 확인
async function selectMembership(userUID) {
    var sql = "select level, startDate, endDate from membership " +
        "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and userUID = ?";
    const [result] = await con.query(sql, userUID);

    if (result.length != 0)
        return {
            auth: result[0].level,
            startDate: result[0].startDate,
            endDate: result[0].endDate
        };
    else
        return {
            auth: "normal",
            startDate: 0,
            endDate: 0
        };
}

// 멤버십 초대자인지 확인
async function selectMembershipGroup(userUID) {
    var sql = "select b.startDate, b.endDate " +
        "from membership_group a " +
        "join membership b on b.userUID = a.ownerUID " +
        "where date_format(b.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and a.userUID = ? " +
        "order by b.endDate desc " +
        "limit 1";
    const [result] = await con.query(sql, userUID);
    if (result.length != 0) { //멤버십 초대자일 때
        return {
            level: "invited",
            startDate: result[0].startDate,
            endDate: result[0].endDate
        };
    } else
        return {
            level: "normal",
            startDate: 0,
            endDate: 0
        };
}

// 사용자 로그인 이력 추가
function insertUserLog(userUID, token) {
    var sql = "insert into user_log(userUID, token) values(?, ?)";
    const sqlData = [userUID, token];
    con.query(sql, sqlData);
}

// jwt 생성
function makeJWT(userUID, level) {
    var token = jwt.sign({
            userUID: userUID,
            auth: level
        },
        secretObj.secret, // 비밀 키
        {
            expiresIn: '30d'
            //expiresIn: '1440m'    // 유효 시간은 1440분
        });

    return token;
}

module.exports = api;