const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const imp_key = "2064037639801337";
const imp_secert = "4ac9b319f5e5943df39f1ac42fd652bb982fe7d250a6d3a03d3150221d08e856aea07ae3f05d07d4";

//방문장착결제 (table : order, reservation)
api.post('/reservation',
// verifyToken,
    // [
        // check("payMethod", "payMethod is required").not().isEmpty(),
        // check("amount", "amount is required").not().isEmpty(),
        // check("applyNum", "applyNum is required").not().isEmpty(),
        // check("bankName", "bankName is required").not().isEmpty(),
        // check("cardNo", "cardNo is required").not().isEmpty(),
        // check("cardQuota", "cardQuota is required").not().isEmpty(),
        // check("impUID", "impUID is required").not().isEmpty()
    // ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            //reservation insert data
            const resCode = reservationCode('RES');
            const userUID = req.body.userUID;
            const email = req.body.email;
            const name = req.body.name;
            const cellNo = req.body.cellNo;
            const rsDateTime = req.body.rsDateTime;
            const carType = req.body.carType;
            const addr1 = req.body.addr1;
            const addr2 = req.body.addr2;
            const postalCode = req.body.postalCode;
            const memo = req.body.memo;
            const resKeepUID = 0;
            const resStts = 1;
            const productUID = req.body.productUID;
            const orderCnt = req.body.orderCnt;
            const antProductUID =req.body.antProductUID;
            const carNo = req.body.carNo;
            const carFullName = req.body.carFullName;
            const carNick = req.body.carNick;
            //order insert data
            const orderType = req.body.orderType;
            const payMethod = req.body.payMethod;
            const amount = req.body.amount;
            const rfamount = 0;
            const applyNum = req.body.applyNum; // import 승인번호
            const bankName = req.body.bankName; // 
            const cardNo = req.body.cardNo; //
            const cardQuota = req.body.cardQuota;
            const impUID = req.body.impUID; // import 결제번호
            let keepUID = 0;
            const reservationUID = ''; // 생성될 reservationUID
            const stts = 1;
            // 쿠폰 정보 확인
            // const couponUID = req.query.couponUID;
            // 쿠폰 할인율 적용
            //보관 여부 확인
            const keep = req.query.keep;
            if(keep == '1'){
                //보관하기 진행
                const keepNo = reservationCode('KEEP');
                const startDate = req.body.startDate;
                const endDate = req.body.endDate;

                const keepResult = await insertOrderKeep(keepNo, startDate, endDate, userUID);
                keepUID = keepResult.insertId;
            }
            //import 결제

            //reservation insert
            const reservationInsert = await insertOrderReservation(resCode, userUID, email, name, cellNo, rsDateTime, carType, addr1, addr2, postalCode, memo, resKeepUID, resStts, productUID, orderCnt, antProductUID, carNo, carFullName, carNick, userUID)



            //order insert
            // const orderInsert = await insertOrder(
            //     orderType,
            //     payMethod,
            //     amount,
            //     rfamount, 
            //     applyNum, 
            //     bankName, 
            //     cardNo, 
            //     cardQuota, 
            //     impUID, 
            //     keepUID, 
            //     reservationInsert.insertId,
            //     stts,
            //     userUID
            // );
            const orderInsert = await order(orderType);
            

            res.status(200).json({
                status : 200,
                data : {
                    reservation : reservationInsert,
                    order : orderInsert
                },
                message : "예약 및 결제 완료"
            })
        }
    }
)
//보관연장 (table : order, keep)
api.post('/extension',
    async function (req, res) {
        const errors = getError(req, res);
        if(errors.isEmpty()){
            // insert order data
            const keepUID = Number(req.query.keepUID);
            const orderType = req.body.orderType;
            const payMethod = req.body.payMethod;
            const amount = req.body.amount;
            const rfamount = req.body.rfamount;
            const applyNum = req.body.applyNum;
            const bankName = req.body.bankName;
            const cardNo = req.body.cardNo;
            const cardQuota = req.body.cardQuota;
            const impUID = req.body.impUID;
            const reservationUID = req.body.reservationUID;
            const stts = req.body.stts;

            var dataSQL = "select * from keep where UID = ?"
            const [data] = await con.query(dataSQL, keepUID);

            // 쿠폰 정보 확인
            // const couponUID = req.query.couponUID;
            // 쿠폰 할인율 적용
            
            const endDate = data[0].endDate;
            var newEndDate = new Date(endDate);
            var oneYearLate = new Date(newEndDate.setFullYear(newEndDate.getFullYear() + 1));
            const updateDate = new Date();
            const updateUser = data[0].regUser;

            var sql = "update keep set endDate = ?, updateDate = ?, updateUser = ? where UID = ?"
            const sqlData = [oneYearLate, updateDate, updateUser, keepUID];

            const [keepResult] = await con.query(sql, sqlData);

            //import 결제

            // insert order 
            const orderData = await insertOrder(
                orderType,
                payMethod,
                amount,
                rfamount,
                applyNum,
                bankName,
                cardNo,
                cardQuota,
                impUID,
                keepUID,
                reservationUID,
                stts,
                updateUser
            );


            res.status(200).json({
                status : 200,
                data : {
                    "keep" : keepResult,
                    "order" : orderData
                },
                message : "success"
            })
        }

    }
)
//보관장착 (table : order, reservation)
api.post('/keepReservation',
    async function (req, res) {
        const errors = getError(req, res);
            if(errors.isEmpty()){
                const resCode = reservationCode('RES');
                const userUID = req.body.userUID;
                const email = req.body.email;
                const name = req.body.name;
                const cellNo = req.body.cellNo;
                const rsDateTime = req.body.rsDateTime;
                const carType = req.body.carType;
                const addr1 = req.body.addr1;
                const addr2 = req.body.addr2;
                const postalCode = req.body.postalCode;
                const memo = req.body.memo;
                const resKeepUID = req.query.keepUID;
                const resStts = 1;
                const productUID = req.body.productUID;
                const orderCnt = req.body.orderCnt;
                const antProductUID =req.body.antProductUID;
                const carNo = req.body.carNo;
                const carFullName = req.body.carFullName;
                const carNick = req.body.carNick;
                // insert order data
                const orderType = req.body.orderType;
                const payMethod = req.body.payMethod;
                const amount = req.body.amount;
                const rfamount = req.body.rfamount;
                const applyNum = req.body.applyNum;
                const bankName = req.body.bankName;
                const cardNo = req.body.cardNo;
                const cardQuota = req.body.cardQuota;
                const impUID = req.body.impUID;
                const reservationUID = req.body.reservationUID;
                const stts = req.body.stts;

                // 쿠폰 정보 확인
                // const couponUID = req.query.couponUID;
                // 쿠폰 할인율 적용

                // import 결제

                //insert order
                const orderData = await insertOrder(
                    orderType,
                    payMethod,
                    amount,
                    rfamount,
                    applyNum,
                    bankName,
                    cardNo,
                    cardQuota,
                    impUID,
                    resKeepUID,
                    reservationUID,
                    stts,
                    userUID
                )
                

                const reservationData = await insertOrderReservation(resCode, userUID, email, name, cellNo, rsDateTime, carType, addr1, addr2, postalCode, memo, resKeepUID, resStts, productUID, orderCnt, antProductUID, carNo, carFullName, carNick, userUID);
            
                res.status(200).json({
                    status : 200,
                    data : {
                        "order" : orderData,
                        "reservationData" : reservationData
                    },
                    message: "success"
                })
            }
        }
)

// api.put('/refund/:orderUID',
//     async function (req, res) {
//         try {
//             const orderUID = req.params.orderUID;
//             const userUID = req.body.userUID;
//             const updateDate = new Date();
//             var sql = "update order set stts = ?, updateUser = ?, updateDate = ? where UID = ?";
//             var sqlData = [0, userUID, updateDate, orderUID];

//             await con.query(sql, sqlData);

//             res.status(200).json({
//                 status : 200,
//                 data : "true",
//                 message : "success",
//             });
//         } catch (err) {
//             throw err;
//         }
//     }
// )

// 이니시스에 환불 요청
api.put("/refund/complete/:orderUID", async function (req, res) {
    try {
        const orderUID = req.params.orderUID;
        const stts = req.body.stts;
        var sql = "select UID, impUID, amount from order where UID = ?";
        const [result] = await con.query(sql, orderUID);
        
        if(result.length == 0){
            // status code 의논 필요
            res.status(403).json({
                status: 403,
                data: "false",
                message: "db에 존재하지 않는 데이터입니다."
            });

            return false;
        }

        const amount = result[0].amount;
        const UID = result[0].UID;
        const impUid = result[0].impUID;

        if (stts == 0) { // 취소승인일 때만 환불 처리
            await refundFromIamport(impUid, amount);
            await refundPayment(amount, UID);
        }
        await completeRefund(orderStatus, UID);

        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (err) {
        res.status(400).send(err);
        throw err;
    }
});

// 아임포트 - 결제 등록
async function importOrder(){
    const access_token = await getToken();

    const result = await axios({
        url: 'https://api.iamport.kr/subscribe/payments/again',
        method: "post",
        headers: {
            "Authorization": access_token
        },
        data: {
            customer_uid: customer_uid,
            // merchant_uid: generateMerchantUid("2", name), // 새로 생성한 결제(재결제)용 주문 번호
            amount: amount,
            name: name,
            custom_data: custom_data
        }
    });

    return result;
}

// 아임포트 - 결제 환불
async function refundFromIamport(impUID, refundAmount) {
    // 인증 토큰 발급 받기
    const access_token = await getToken();

    const getCancelData = await axios({
        url: "https://api.iamport.kr/payments/cancel",
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": access_token // 아임포트 서버로부터 발급받은 엑세스 토큰
        },
        data: {
            reason: "고객요청에의한 환불", // 가맹점 클라이언트로부터 받은 환불사유
            imp_uid: impUID, // imp_uid를 환불 `unique key`로 입력
            amount: refundAmount, // 가맹점 클라이언트로부터 받은 환불금액
            checksum: refundAmount // [권장] 환불 가능 금액 입력
        }
    });

    return getCancelData.data.response;
}

// 관리자 - 주문을 환불 정보로 수정 (아임포트 정보)
async function refundPayment(amount, UID) {
    var sql = "update order set rfamount = ?, stts = '취소승인' where UID = ?";
    var sqlData = [amount, UID];
    await con.query(sql, sqlData);
}


// 주문정보 추가
async function insertOrder (
    orderType,
    payMethod,
    amount,
    rfamount,
    applyNum,
    bankName,
    cardNo,
    cardQuota,
    impUID,
    keepUID,
    reservationUID,
    stts,
    regUser) {
    const regDate = new Date();
    var sql = "insert into order(orderType, payMethod, amount, rfamount, applyNum, bankName, cardNo, cardQuota, impUID, keepUID, reservationUID, stts, regUser, regDate) values(?)"
    const sqlData = [orderType, payMethod, amount, rfamount, applyNum, bankName, cardNo, cardQuota, impUID, keepUID, reservationUID, stts, regUser, regDate];
    const [result] = await con.query(sql,[sqlData]);

    return result;
}
async function order (orderType){
    var sql = "insert into order(orderType) values(?)";
    const sqlData = [orderType];
    const [result] = await con.query(sql,[sqlData])

    return result;
}
// 방문장착 reservation 추가
async function insertOrderReservation (code, userUID, email, name, cellNo, rsDateTime, carType, addr1, addr2, postalCode, memo, keepUID, stts, productUID, orderCnt, antProductUID, carNo, carFullName, carNick){
    const regDate = new Date();
    var sql = "insert into reservation(code, userUID, email, name, cellNo, rsDateTime, carType, addr1, addr2, postalCode, memo, keepUID, stts, productUID, orderCnt, antProductUID, carNo, carFullName, carNick, regDate, regUser) values(?)"
    const sqlData = [code, userUID, email, name, cellNo, rsDateTime, carType, addr1, addr2, postalCode, memo, keepUID, stts, productUID, orderCnt, antProductUID, carNo, carFullName, carNick, regDate, userUID];
    const [result] = await con.query(sql,[sqlData]);

    return result;
}
// 보관하기 추가
async function insertOrderKeep (keepNo, startDate, endDate, regUser){
    const regDate = new Date();
    var sql = "insert into keep(keepNo, startDate, endDate, regDate, regUser) values(?)"
    const sqlData = [keepNo, startDate, endDate, regDate, regUser];
    const [result] = await con.query(sql, [sqlData]);

    return result;
}

function reservationCode(type){
    let str = type +''
    for(let i = 0; i < 10; i++){
        str += Math.floor(Math.random() * 10)
    }


    return str;
}

// 아임포트 - 토큰 조회
async function getToken() {
    const getToken = await axios({
        url: "https://api.iamport.kr/users/getToken",
        method: "post", // POST method
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            imp_key: imp_key,
            imp_secret: imp_secret
        }
    });

    return getToken.data.response.access_token;
}


module.exports = api;