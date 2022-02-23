const express = require('express');
const { con } = require('./config/database.js');
const db = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { getCurrentDateTime } = require('./config/date.js');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

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

// 특정 회원에게 멤버십 제공
api.post('/', 
        verifyAdminToken,
        [
            check("userUID", "userUID is required").not().isEmpty(),
            check("level", "level is required").not().isEmpty(),
            check("startDate", "startDate is required").not().isEmpty(),
            check("endDate", "endDate is required").not().isEmpty(),
            check("memo", "memo is required").exists()
        ], 
        async function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const adminUID = req.adminUID;
                    const userUID = req.body.userUID;
                    const level = req.body.level;
                    const startDate = req.body.startDate;
                    const endDate = req.body.endDate;
                    const memo = req.body.memo;
                    const token = req.headers.token;

                    const membershipUID = await selectMembershipUID(userUID);
                    if(membershipUID != 0) {
                        res.status(403).send({
                            status: 403,
                            data: "false",
                            message: "멤버십을 구독하고 있는 회원입니다."
                        });

                        return false;
                    }

                    const sqlData = [userUID, level, startDate, endDate, memo, adminUID];
                    await insertMembershipAuth(sqlData);
                    await insertMembershipLog(adminUID, token);

                    res.status(200).json({
                        status: 200,
                        data: "true",
                        message: "success"
                    });
                } catch (err) {
                    throw err;
                }
            }
        }
);

// 2주 무료 이용권 (free trial) 추가
api.post('/free_trial', 
        verifyToken,
        [
            check("userUID", "userUID is required").not().isEmpty(),
            check("type", "type is required").not().isEmpty()
        ], 
        async function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const userUID = req.body.userUID;
                    const type = req.body.type; // web or app

                    const cellNum = await selectUserCellNum(userUID);
                    const isExist = await isExistFreeTrialHistory(cellNum); // 해당 번호로 free_trial을 이용한 이력 있는지 조회

                    if(type == 'web'){
                        if(isExist){
                            res.status(403).send({
                                status: 403,
                                data: "false",
                                message: "Free Trial을 이용한 이력이 존재합니다."
                            });

                            return false;
                        }
                    }
                    else if(type == 'app'){
                        if(isExist){ // 2주차 멤버십 부여된 이력 존재하는 경우
                            res.status(403).send({
                                status: 403,
                                data: "false",
                                message: "Free Trial을 이용한 이력이 존재합니다."
                            });
    
                            return false;
                        }
    
                        const membershipUID = await selectMembershipUID(userUID);
                        if(membershipUID != 0) // 구독한 멤버십이 존재하는 경우
                            await updateFreeMembership(membershipUID.UID);
                        else
                            await insertFreeMembership(userUID);
                            
                        await updateUserFreeTrial(userUID);                        
                    }

                    res.status(200).json({
                        status: 200,
                        data: "true",
                        message: "success"
                    });
                } catch (err) {
                    throw err;
                }
            }
        }
);

// 진성님 멤버십 변경 테스트
api.put('/jinsung', async function (req, res) {
    try{
        const level = req.body.level;
        if(!(level == 'single' || level == 'mobile' || level == 'IOS_mobile' || level == 'friends' || level == 'family' || level == 'free_trial')){
            res.status(403).send({
                status: 403,
                data: 'false',
                message: "멤버십 이름이 잘못되었습니다. (single, mobile, IOS_mobile, firends, family, free_trial만 가능합니다)"
            });

            return false;
        }

        var sql = "update membership set level = ? where userUID = 1607";
        await con.query(sql, level);
        res.status(200).send({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 진성님 멤버십 삭제 테스트
api.delete('/jinsung', async function (req, res) {
    try{
        var sql = "delete from membership where userUID = 1607";
        await con.query(sql);
        res.status(200).send({
            status: 200,
            data: "true",
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
    return result[0].cnt;
}

// 신규 멤버십 가입자 수
async function selectTodayMemCnt(){
    var sql = "select count(UID) as cnt from membership where date_format(startDate, '%Y-%m-%d') = date_format(now(), '%Y-%m-%d')";
    const [result] = await con.query(sql);
    return result[0].cnt;
}

// 멤버십 구독자인지 확인
// payment.js 에서도 사용하는 함수
async function selectMembershipUID(userUID) {
    var sql = "select UID, endDate from membership where userUID = ?";
    const [result] = await con.query(sql, userUID);

    if(result.length != 0)
        return result[0];
    else    
        return 0;
}

// login.js 에서도 사용하는 함수 (login.js에서는 userUID == undefined 처리는 하지 않음)
// 멤버십 소유자인지 확인
async function selectMembership(userUID) {
    if (userUID == undefined) {
        var sql = "select userUID from membership";
        const [result] = await con.query(sql);
        var userUIDs = [];
        for (var i in result) {
            userUIDs.push(result[i].userUID);
        }
        return userUIDs;
    } else {
        var sql = "select UID, level, startDate, endDate from membership " +
            "where date_format(startDate, '%Y-%m-%d') <= date_format(now(), '%Y-%m-%d') " +
            "and date_format(endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') " +
            "and userUID = ?";
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
    if(level == "single" || level == "IOS_mobile" || level == "mobile" || level == "free_trial")
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
        "where date_format(b.startDate, '%Y-%m-%d') <= date_format(now(), '%Y-%m-%d') " +
        "and date_format(b.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') " +  
        "and a.userUID = ? " +
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

// 멤버십 제공
async function insertMembershipAuth(sqlData){
    var sql = "insert membership(userUID, level, startDate, endDate, memo, regUID) values (?)";
    await con.query(sql, [sqlData]);
}

// 멤버십 제공 로그 등록
async function insertMembershipLog(adminUID, token){
    var sql = "insert admin_log(adminUID, token, action) values (?)";
    const action = '멤버십 제공';
    const sqlData = [adminUID, token, action];
    await con.query(sql, [sqlData]);
}

// 휴대폰 번호 조회
async function selectUserCellNum(userUID){
    var sql = "select cellNumber from user where UID = ?";
    const [result] = await con.query(sql, userUID);
    return result[0].cellNumber;
}

// 해당 번호로 freeTrial 부여 받은 이력 있는지 조회
async function isExistFreeTrialHistory(cellNumber){
    var sql = "select freeTrial " +
            "from user " + 
            "where (cellNumber = ? OR substring_index(email, '/', -1) = ?) and freeTrial = 1";
    const sqlData = [cellNumber, cellNumber];
    const [result] = await con.query(sql, sqlData);
    if(result.length > 0)
        return true;
    else
        return false;
}

// 2주 무료 이용권 제공
async function insertFreeMembership(userUID){
    var sql = "insert membership(userUID, level, endDate, paymentUID) values (?, ?, date_add(curdate(), interval ? day), ?)";
    const level = "free_trial";
    const paymentUID = 0;
    const day = 14;
    const sqlData = [userUID, level, day, paymentUID];
    const [result] = await con.query(sql, sqlData);
    return result.insertId;
}

// 2주 무료 이용권으로 멤버십 업데이트
async function updateFreeMembership(membershipUID){
    var sql = "update membership set level='free_trial', endDate = date_add(curdate(), interval ? day) where UID = ?";
    const day = 14;
    const sqlData = [day, membershipUID];
    await con.query(sql, sqlData);
}

// 2무 무료 이용권 제공 이력 추가
async function updateUserFreeTrial(userUID){
    var sql = "update user set freeTrial=true where UID = ?";
    await con.query(sql, userUID);
}

module.exports = api;