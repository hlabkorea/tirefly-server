const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { sendInviteEmail } = require('./config/mail.js');

// 소유자의 멤버 리스트 조회
api.get('/members/:ownerUID',
    verifyToken,
    async function (req, res, next) {
        try{
            const ownerUID = req.params.ownerUID;
            var sql = "select UID as groupUID, email from membership_group where ownerUID = ? order by email";
            const [result] = await con.query(sql, ownerUID);

            res.status(200).json({
                status: 200,
                data: result,
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 멤버의 소유자 리스트 조회
api.get('/owners/:userUID',
    verifyToken,
    async function (req, res, next) {
        try{
            const userUID = req.params.userUID;
            var sql = "select b.email, c.level, c.startDate, c.endDate " +
                "from membership_group a " +
                "join user b on a.ownerUID = b.UID " +
                "join membership c on a.ownerUID = c.userUID " +
                "where a.userUID = ? and date_format(c.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') " +
                "group by a.ownerUID " +
                "order by a.email";
            const [result] = await con.query(sql, userUID);

            res.status(200).json({
                status: 200,
                data: result,
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 멤버십 그룹에 추가
api.post('/',
    verifyToken,
    [
        check("ownerUID", "ownerUID is required").not().isEmpty(),
        check("email", "email is required").not().isEmpty(),
        check("level", "level is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const ownerUID = req.body.ownerUID;
                const email = req.body.email;
                const level = req.body.level;

                if (level == "single" || level == "mobile") { // single과 mobile 등급은 회원 초대 불가능
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "초대가 불가능합니다."
                    }); // 메시지 수정
                    return false;
                }

                const userUID = await selectUserUID(email);

                if(ownerUID == userUID){
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "본인은 초대가 불가능합니다."
                    }); // 메시지 수정
                    return false;
                }

                const memberCnt = await selectGroupCount(ownerUID);
                if (isFull(level, memberCnt)) {
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "인원이 초과하여 초대가 불가능합니다."
                    }); // 메시지 수정
                    return false;
                }

                if (await isInvited(ownerUID, email)) {
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "이미 초대된 계정입니다."
                    });
                    return false;
                }

                await insertMembershipGroup(ownerUID, userUID, email);
                const ownerEmail = await selectOwnerEmail(ownerUID);
                sendInviteEmail(ownerEmail, email);

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "초대 메일이 전송되었습니다."
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// 멤버십 그룹에서 계정 삭제
api.delete('/:groupUID',
    verifyToken,
    async function (req, res, next) {
        try{
            const groupUID = req.params.groupUID;
            var sql = "delete from membership_group where UID = ?";
            await con.query(sql, groupUID);

            res.status(200).json({
                status: 200,
                data: "true",
                message: "계정이 삭제되었습니다."
            });
        } catch (err) {
            throw err;
        }
    }
);

// 초대할 회원의 userUID 조회
async function selectUserUID(email) {
    var sql = "select UID from user where email = ?";
    const [result] = await con.query(sql, email);

    if (result.length != 0)
        return result[0].UID;
    else
        return 0;
}

// 멤버십 소유자의 이메일 조회
async function selectOwnerEmail(ownerUID) {
    var sql = "select email from user where UID = ?";
    const [result] = await con.query(sql, ownerUID);
    return result[0].email;
}

// 초대한 회원의 수 조회
async function selectGroupCount(ownerUID) {
    var sql = "select count(*) as count from membership_group where ownerUID = ?";
    const [result] = await con.query(sql, ownerUID);
    return result[0].count;
}

// 인원 초과 여부 조회
function isFull(level, memberCnt) {
    if (level == "single" || level == "mobile")
        return true;
    else if (level == "friends" && memberCnt >= 2) // owner를 제외하고 2명
        return true;
    else if (level == "family" && memberCnt >= 4) // owner를 제외하고 4명
        return true;

    return false;
}

// 초대 여부 조회
async function isInvited(ownerUID, email) {
    var sql = "select UID from membership_group where ownerUID = ? and email = ?";
    const sqlData = [ownerUID, email];
    const [result] = await con.query(sql, sqlData);

    if (result.length != 0)
        return true;
    else
        return false;
}

// 멤버십 그룹에 추가
async function insertMembershipGroup(ownerUID, userUID, email) {
    var sql = "insert membership_group(ownerUID, userUID, email) values (?)";
    const sqlData = [ownerUID, userUID, email];
    await con.query(sql, [sqlData]);
}

module.exports = api;