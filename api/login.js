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
                var loginSql = "select UID, status, nickName from user where email = ? and password = ? and status != 'delete'";
                const loginData = [email, password];
                const [loginRes] = await con.query(loginSql, loginData);

                if (loginRes.length == 0) { // 비밀번호 불일치
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "비밀번호가 맞지 않아요!"
                    });

                    return false;
                }

                const userUID = loginRes[0].UID;
                var redirect = "setting";

                if (loginRes[0].status == "sleep") // 휴면 페이지
                    redirect = "sleep";
                else if (loginRes[0].nickName.length > 0) // 세팅 정보 페이지
                    redirect = "contents";

                // 멤버십 소유자인지 확인
                var membershipSql = "select level, endDate from membership " +
                    "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and userUID = ?";
                const [membershipRes] = await con.query(membershipSql, userUID);
                var auth = "normal";
                var endDate = 0;

                if (membershipRes.length != 0) { // 멤버십 소유자
                    auth = membershipRes[0].level;
                    endDate = membershipRes[0].endDate;
                } else { // 멤버십 초대자인지 확인
                    var membershipGroupSql = "select b.endDate " +
                        "from membership_group a " +
                        "join membership b on b.userUID = a.ownerUID " +
                        "where date_format(b.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and a.userUID = ? " +
                        "order by b.endDate desc " +
                        "limit 1";
                    const [membershipGroupRes] = await con.query(membershipGroupSql, userUID);
                    if (membershipGroupRes.length != 0) { //멤버십 초대자일 때
                        auth = "invited";
                        endDate = membershipGroupRes[0].endDate;
                    }
                }

                const token = jwt.sign({
                        userUID: userUID,
                        auth: auth
                    },
                    secretObj.secret, // 비밀 키
                    {
                        expiresIn: '30d'
                        //expiresIn: '1440m'    // 유효 시간은 1440분
                    });

                res.status(200).send({
                    status: 200,
                    data: {
                        UID: userUID,
                        email: email,
                        token: token,
                        redirect: redirect,
                        auth: auth,
                        endDate: endDate
                    }
                });

                // 토큰 이력 추가
                var tokenSql = "insert into user_log(userUID, token) values(?, ?)";
                const tokenData = [userUID, token];
                con.query(tokenSql, tokenData);
            } catch (err) {
                throw err;
            }
        }
    }
);

api.post('/function',
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
                const loginRes = await checkPasswd(email, password);
                if(!loginRes.isEqual){ // 비밀번호 불일치
                    res.status(403).send({
                        status: 403,
                        data: [],
                        message: "비밀번호가 맞지 않아요!"
                    });

                    return false;
                }

                const userUID = loginRes.userUID;
                const redirect = loginRes.redirect;

                // 멤버십 소유자인지 확인
                const membershipRes = await checkMembership(userUID);
                var auth = membershipRes.auth;
                var endDate = membershipRes.endDate;

                if(auth == "normal") { //멤버십 소유자가 아닐 경우 멤버십 초대자인지 확인
                    const membershipGroupRes = await checkMembershipGroup(userUID);
                    auth = membershipGroupRes.auth;
                    endDate = membershipGroupRes.endDate;
                }

                // jwt 토큰 생성
                const token = makeJWT(userUID, auth);

                res.status(200).send({
                    status: 200,
                    data: {
                        UID: userUID,
                        email: email,
                        token: token,
                        redirect: redirect,
                        auth: auth,
                        endDate: endDate
                    }
                });

                // 토큰 이력 추가
                insertToken(userUID, token);
            } catch (err) {
                throw err;
            }
        }
    }
);

async function checkPasswd(email, password) {
    var loginSql = "select UID, status, nickName from user where email = ? and password = ? and status != 'delete'";
    const loginData = [email, password];
    const [loginRes] = await con.query(loginSql, loginData);

    if(loginRes.length == 0)
        return {isEqual: false, userUID: 0, redirect: ""};
    else{
        var redirect = "";
        if (loginRes[0].status == "sleep") // 휴면 페이지
            redirect = "sleep";
        else if (loginRes[0].nickName.length > 0) // vod 메인 페이지
            redirect = "contents";
        else // 세팅 정보 페이지
            redirect = "setting";

        return {isEqual: true, userUID: loginRes[0].UID, redirect: redirect};
    }
}

async function checkMembership(userUID) {
    var membershipSql = "select level, endDate from membership " +
                    "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and userUID = ?";
    const [membershipRes] = await con.query(membershipSql, userUID);
    if (membershipRes.length != 0)
        return {auth: membershipRes[0].level, endDate: membershipRes[0].endDate};
    else
        return {auth: "normal", endDate: 0};
}

async function checkMembershipGroup(userUID) {
    var membershipGroupSql = "select b.endDate " +
                        "from membership_group a " +
                        "join membership b on b.userUID = a.ownerUID " +
                        "where date_format(b.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and a.userUID = ? " +
                        "order by b.endDate desc " +
                        "limit 1";
    const [membershipGroupRes] = await con.query(membershipGroupSql, userUID);
    if (membershipGroupRes.length != 0) { //멤버십 초대자일 때
        return {auth: "invited", endDate: membershipGroupRes[0].endDate};
    }
    else
        return {auth: "normal", endDate: 0};
}

async function insertToken(userUID, token) {
    var tokenSql = "insert into user_log(userUID, token) values(?, ?)";
    const tokenData = [userUID, token];
    con.query(tokenSql, tokenData);
}

function makeJWT(userUID, auth) {
    var token = jwt.sign({
        userUID: userUID,
        auth: auth
    },
    secretObj.secret, // 비밀 키
    {
        expiresIn: '30d'
        //expiresIn: '1440m'    // 유효 시간은 1440분
    });

    return token;
}

module.exports = api;
