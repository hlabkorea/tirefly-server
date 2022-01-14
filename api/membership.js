const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { getCurrentDateTime } = require('./config/date.js');

// 멤버십 소유자인지 조회
api.get('/auth/:userUID', verifyToken, async function (req, res) {
    try{
        const userUID = req.params.userUID;
        var sql = "select * from membership where userUID = ? order by regDate desc limit 1";
        const [result] = await con.query(sql, userUID);
        
        if(result.length != 0){
            const endDate = result[0].endDate;
            const curDate = getCurrentDateTime();

            if(curDate <= endDate)
                res.status(200).json({status:200,  data: "true", message:"success"});
            else
                res.status(403).json({status:403,  data: "false", message:"이용 중인 멤버십이 존재합니다. 남은 기간을 소진한 후 다시 이용해주세요."});
        }
        else
            res.status(200).json({status:200,  data: "false", message:"fail"}); // status code 403으로 수정
    } catch (err) {
        throw err;
    }
});

// 멤버십 정보 조회
api.get('/:userUID', verifyToken, async function (req, res) {
    try{
        const userUID = req.params.userUID;

        // 멤버십 소유자인지 확인
        const membershipRes = await selectMembership(userUID);
        var level = membershipRes.auth;
        var endDate = membershipRes.endDate;
        var startDate = membershipRes.startDate;
        var maxCount = 0;

        if (level == "normal") {
            // 멤버십 초대자인지 확인
            const membershipGroupRes = await selectMembershipGroup(userUID);
            level = membershipGroupRes.level;
            endDate = membershipGroupRes.endDate;
            startDate = membershipGroupRes.startDate;
        }
        else{
            maxCount = getMaxCount(level);
        }

        res.status(200).send({
            status: 200,
            data: {
                level: level,
                startDate: startDate,
                endDate: endDate,
                maxCount: maxCount
            },
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 테스트 - hlab_04@hlabtech.com 멤버십 삭제
api.delete('/',
    async function (req, res) {
        try{
            var sql = "update membership set endDate = '0000-01-01' where userUID = 1523";
            await con.query(sql);
            res.status(200).json({
                status: 200,
                data: "true",
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 테스트 - hurgoon@gmail.com 멤버십 삭제
api.delete('/hurgoon',
    async function (req, res) {
        try{
            var sql = "update membership set endDate = '0000-01-01' where userUID = 1584";
            await con.query(sql);

            res.status(200).json({
                status: 200,
                data: "true",
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// login.js 에서도 사용하는 함수
// 멤버십 소유자인지 확인
async function selectMembership(userUID) {
    var sql = "select UID, level, startDate, endDate from membership " +
        "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and userUID = ?";
    const [result] = await con.query(sql, userUID);

    if (result.length != 0)
        return {
            UID: result[0].UID,
            auth: result[0].level,
            startDate: result[0].startDate,
            endDate: result[0].endDate
        };
    else
        return {
            UID: 0,
            auth: "normal",
            startDate: "0000-01-01 00:00:00",
            endDate: "0000-01-01 00:00:00"
        };
}

// 멤버십 등급에 따라 maxCount 조회
function getMaxCount(level) {
    if(level == "single" || level == "IOS_mobile" || level == "mobile")
        return 1;
    else if(level == "friends")
        return 3;
    else if(level == "family")
        return 5;
}

// login.js 에서도 사용하는 함수
// 멤버십 초대자인지 확인
async function selectMembershipGroup(userUID) {
    var sql = "select b.startDate, b.endDate " +
        "from membership_group a " +
        "join membership b on b.userUID = a.ownerUID " +
        "where date_format(b.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and a.userUID = ? " +
        "order by b.endDate desc " + // 여러 명에게 초대될 수 있으므로, 리스트 중 가장 긴 유효기간이 출력되어야 함
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
            startDate: "0000-01-01 00:00:00",
            endDate: "0000-01-01 00:00:00"
        };
}


module.exports = api;