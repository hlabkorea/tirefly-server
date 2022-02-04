const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { getCurrentDateTime } = require('./config/date.js');

// 멤버십 소유자들 조회 - membership_check.html 에서 사용
api.get('/', async function (req, res) {
    try{
        var sql = "select a.userUID, b.email, b.nickName, a.`level`, a.startDate, a.endDate " + 
                  "from membership a " +
                  "left join user b on a.userUID = b.UID " +
                  "order by a.endDate desc";
        const [result] = await con.query(sql);
        
        res.status(200).json({status:200,  data: result, message:"success"});
    } catch (err) {
        throw err;
    }
});


// 멤버십 소유자인지 조회
api.get('/auth/:userUID', verifyToken, async function (req, res) {
    try{
        const userUID = req.params.userUID;
        var sql = "select * from membership where userUID = ? order by regDate desc limit 1";
        const [result] = await con.query(sql, userUID);
        
        if(result.length != 0){ // 멤버십 소유자인 경우
            const endDate = result[0].endDate;
            const curDate = getCurrentDateTime(); // 현재 Datetime 조회

            if(curDate <= endDate)
                res.status(200).json({status:200,  data: "true", message:"success"});
            else
                res.status(403).json({status:403,  data: "false", message:"이용 중인 멤버십이 존재합니다. 남은 기간을 소진한 후 다시 이용해주세요."});
        }
        else // 멤버십 소유자가 아닌 경우
            res.status(200).json({status:200,  data: "false", message:"fail"}); // status code 403으로 수정
    } catch (err) {
        throw err;
    }
});

// 멤버십 구독자 현황 조회
api.get('/count', verifyAdminToken, async function (req, res) {
    try{
        const memRes = await selectMembership(); // 멤버십 사용자들 조회
        var totalCnt = memRes.length;
        totalCnt += await selectMemGroupCnt(memRes); // 멤버십 소유자가 초대자인 경우를 제외한 초대자 수 조회
        const newCnt = await selectTodayMemCnt(); // 오늘 가입한 멤버십 구독자 수 조회

        res.status(200).send({
            status: 200,
            data: {
                totalCnt: totalCnt,
                newCnt: newCnt
            },
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 멤버십 구독자 현황 조회
api.get('/level/count', verifyAdminToken, async function (req, res) {
    try{
        var sql = "select level, count(UID) as count from membership group by level";
        const [result] = await con.query(sql);
        res.status(200).send({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 멤버십 정보 조회
api.get('/:userUID', verifyToken, async function (req, res) {
    try{
        const userUID = req.params.userUID;

        // 멤버십 소유자인지 확인
        const membershipRes = await selectMembership(userUID); // 멤버십 소유자 여부에 대한 결과 조회
        var level = membershipRes.auth;
        var endDate = membershipRes.endDate;
        var startDate = membershipRes.startDate;
        var maxCount = 0;

        if (level == "normal") { // 멤버십 소유 권한이 없을 경우
            // 멤버십 초대자인지 확인
            const membershipGroupRes = await selectMembershipGroup(userUID);
            level = membershipGroupRes.level;
            endDate = membershipGroupRes.endDate;
            startDate = membershipGroupRes.startDate;
        }
        else{ // 멤버십 소유 권한이 있을 경우
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

// 멤버십 초대자 수 (멤버십 구매자는 제외)
async function selectMemGroupCnt(sqlData){
    var sql = "select count(distinct userUID) as cnt "
            + "from membership_group "
            + "where userUID not in (?)";
    const [result] = await con.query(sql, [sqlData]);
    console.log(result);
    return result[0].cnt;
}

// 신규 멤버십 가입자 수
async function selectTodayMemCnt(){
    var sql = "select count(UID) as cnt from membership where date_format(startDate, '%Y-%m-%d') = date_format(now(), '%Y-%m-%d')";
    const [result] = await con.query(sql);
    return result[0].cnt;
}

// login.js 에서도 사용하는 함수 (login.js에서는 userUID == undefined 처리는 하지 않음)
// 멤버십 소유자인지 확인
async function selectMembership(userUID) {
    if(userUID == undefined){
        var sql = "select userUID from membership";
        const [result] = await con.query(sql);
        var userUIDs = [];
        for(var i in result){
            userUIDs.push(result[i].userUID);
        }
        return userUIDs;
    }
    else{
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
                endDate: "0000-01-01"
            };
    }
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
            endDate: "0000-01-01"
        };
}


module.exports = api;