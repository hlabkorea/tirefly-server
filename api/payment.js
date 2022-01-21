const express = require('express');
const { con } = require('./config/database.js');
const api = express.Router();
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const axios = require('axios');
const { generateRandomNumber } = require('./config/generateRandomNumber.js');
const { getPageInfo } = require('./config/paging.js'); 
const { getNextDateTime } = require('./config/date.js');
const { sendPaymentMail, sendMembershipEmail } = require('./config/mail.js');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const imp_key = "7260030924750208"; // REST API 키
const imp_secret = "abc8d306c8df0b4354dd438c5ab9d5af9bf06094734cc1936780beef5fa4a6ab585b1219b7b09a4b"; // REST API Secret
const apple_password = "157cd3c52883418cabfab06e2b206da7";
//const imp_key = "5425471433410805"; // 테스트 REST API 키
//const imp_secret = "L76UxuB5wmV0TRtcRR3iBYiGz38AOiTAq0uXu630tY1mPuzHmC0YBiEamNLa6FLwFfu9mxaPwccmGL33"; // 테스트 REST API Secret
const pageCnt15 = 15;
const pageCnt10 = 10;

// 주문정보 조회
api.get('/',
    verifyAdminToken,
    async function (req, res, next) {
        try{
            const type = req.query.type ? req.query.type : 'product'; // default로는 product를 조회하게
            const searchType = req.query.searchType ? req.query.searchType : '' ;
            const searchWord = req.query.searchWord ? req.query.searchWord : '';
            const startDate = req.query.startDate ? req.query.startDate : '';
            const endDate = req.query.endDate ? req.query.endDate : '';
            const currentPage = req.query.page ? parseInt(req.query.page) : 1;
            const offset = parseInt(currentPage - 1) * pageCnt15;

            const countRes = await selectPaymentSales(type, searchType, searchWord, startDate, endDate);
            const totalPrice = parseInt(countRes.totalPrice);
            const totalCount = countRes.totalCount;
            const refundPrice = parseInt(countRes.refundPrice);
            const refundCount = countRes.refundCount;
            const profitPrice = parseInt(countRes.profitPrice);
            const profitCount = countRes.profitCount;

            var result;
            if (type == "product")
                result = await selectPaymentProduct(type, searchType, searchWord, startDate, endDate, offset);
            else if (type == "membership")
                result = await selectPaymentMembership(type, searchType, searchWord, startDate, endDate, offset);

            const {
                startPage,
                endPage,
                totalPage
            } = getPageInfo(currentPage, totalCount, pageCnt15);
            res.status(200).json({
                status: 200,
                data: {
                    paging: {
                        startPage: startPage,
                        endPage: endPage,
                        totalPage: totalPage
                    },
                    sales: {
                        totalPrice: totalPrice,
                        totalCount: totalCount,
                        refundPrice: refundPrice,
                        refundCount: refundCount,
                        profitPrice: profitPrice,
                        profitCount: profitCount
                    },
                    result: result
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 배송정보 조회
api.get('/ship',
    verifyAdminToken,
    async function (req, res, next) {
        try{
            const status = req.query.status ? req.query.status : '';
            const searchType = req.query.searchType ? req.query.searchType : '';
            const searchWord = req.query.searchWord ? req.query.searchWord : '';
            const startDate = req.query.startDate ? req.query.startDate : '';
            const endDate = req.query.endDate ? req.query.endDate : '';
            const currentPage = req.query.page ? parseInt(req.query.page) : 1;
            const offset = parseInt(currentPage - 1) * pageCnt15;

            const countRes = await selectPaymentShipStatus(status, searchType, searchWord, startDate, endDate);
            const totalCnt = parseInt(countRes.totalCnt);
            const befShipCnt = parseInt(countRes.befShipCnt);
            const rdyShipCnt = parseInt(countRes.rdyShipCnt);
            const confShipCnt = parseInt(countRes.confShipCnt);

            const result = await selectPaymentShip(status, searchType, searchWord, startDate, endDate, offset);

            const {
                startPage,
                endPage,
                totalPage
            } = getPageInfo(currentPage, totalCnt, pageCnt15);
            res.status(200).json({
                status: 200,
                data: {
                    paging: {
                        startPage: startPage,
                        endPage: endPage,
                        totalPage: totalPage
                    },
                    status: {
                        totalCnt: totalCnt,
                        befShipCnt: befShipCnt,
                        rdyShipCnt: rdyShipCnt,
                        confShipCnt: confShipCnt
                    },
                    result: result
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 오늘 주문 상품 총 가격과 건수 조회
api.get('/today',
    verifyAdminToken,
    async function (req, res, next) {
        try {
            var sql = "select sum(amount) as sales, count(UID) as count from payment " +
                "where type='product' and date_format(regDate, '%Y-%m-%d') = date_format(now(), '%Y-%m-%d')";
            const [result] = await con.query(sql);

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

// 매출 (건수) 조회
api.get('/week',
    verifyAdminToken,
    async function (req, res, next) {
        try {
            const productRes = await selectWeekProduct();
            const membershipRes = await selectWeekMembership();

            res.status(200).json({
                status: 200,
                data: {
                    product: productRes,
                    membership: membershipRes
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 배송 스케쥴 조회
api.get('/ship/schedule',
    verifyAdminToken,
    async function (req, res, next) {
        try{
            const startDate = req.query.startDate;
            const endDate = req.query.endDate;
            var sql = "select a.UID as paymentUID, concat(a.addr1, ' ', a.addr2) as addr, a.shippingStatus, a.shipResDate as shippingDate, " +
                "c.korName, d.optionName " +
                "from payment a " +
                "join payment_product_list b on a.UID = b.paymentUID " +
                "join product c on b.productUID = c.UID " +
                "join product_option_list d on b.optionUID = d.UID " +
                "where a.shippingStatus != '배송전' and (date_format(a.shipResDate, '%Y-%m-%d') between ? and ?) and a.type='product'";
            const sqlData = [startDate, endDate];
            const [result] = await con.query(sql, sqlData);

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

// 미러를 구매한 사용자인지 조회
api.get('/check/:userUID',
    verifyToken,
    async function (req, res, next) {
        try{
            const userUID = req.params.userUID;
            var sql = "select a.UID " +
                "from payment a " +
                "join payment_product_list b on a.UID = b.paymentUID " +
                "where a.userUID = ? and b.productUID = 1 and a.paymentStatus != 'cancelled'";
            const [result] = await con.query(sql, userUID);
            
            if (result.length > 0){ // 미러를 구매한 사용자일 경우
                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            }
            else{
                res.status(200).json({ // 미러를 구매하지 않은 사용자일 경우
                    status: 200,
                    data: "false",
                    message: "fail"
                });
            }
        } catch (err) {
            throw err;
        }
    }
);

// 멤버십을 무료로 구매할 수 있는 사용자인지 조회
api.get('/check/free/:userUID',
    verifyToken,
    async function (req, res, next) {
        try{
            const userUID = req.params.userUID;
            const isPurchase = await isPurchaseMirror(userUID);

            if(isPurchase == false){
                res.status(200).json({
                    status: 200,
                    data: "false",
                    message: "fail"
                });
                return false;
            }

            const membershipUID = await selectMembershipUID(userUID);

            if(membershipUID == 0){
                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            }
            else{
                res.status(200).json({
                    status: 200,
                    data: "false",
                    message: "fail"
                });
            }
        } catch (err) {
            throw err;
        }
    }
);

// 멤버십 구매 내역 조회
api.get('/membership/:userUID',
    verifyToken,
    async function (req, res, next) {
        try{
            const userUID = req.params.userUID;
            const currentPage = req.query.page ? parseInt(req.query.page) : 1;
            var sql = "select a.UID as paymentUID, a.name, a.amount, a.payMethod, a.regDate, date_add(date_format(a.regDate, '%Y-%m-%d 23:59:59'), interval 1 month) as membershipEndDate " +
                "from payment a " +
                "join payment_product_list b on a.UID = b.paymentUID " +
                "where a.userUID = ? and a.type = 'membership' " +
                "order by a.regDate desc ";
            const sqlData = [userUID, userUID];

            var countSql = sql + ";";

            const offset = parseInt(currentPage - 1) * pageCnt10;
            sql += `limit ${offset}, ${pageCnt10}`;

            const [result] = await con.query(countSql + sql, sqlData);
            const {
                startPage,
                endPage,
                totalPage
            } = getPageInfo(currentPage, result[0].length, pageCnt10);

            res.status(200).json({
                status: 200,
                data: {
                    paging: {
                        startPage: startPage,
                        endPage: endPage,
                        totalPage: totalPage
                    },
                    result: result[1]
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 결제한 상품의 정보 조회
api.get('/product/info/:paymentUID',
    verifyToken,
    async function (req, res, next) {
        try{
            const paymentUID = req.params.paymentUID;
            var sql = "select e.imgPath, c.korName, c.engName, c.originPrice, c.discountRate, c.discountPrice, d.optionName, a.regDate, a.merchantUid, a.amount, b.count, a.orderStatus, a.shippingStatus " +
                "from payment a " +
                "join payment_product_list b on a.UID = b.paymentUID " +
                "join product c on b.productUID = c.UID " +
                "join product_option_list d on c.UID = d.productUID " +
                "join product_img_list e on c.UID = e.productUID " +
                "where a.UID = ? " +
                "group by a.UID " +
                "order by a.regDate desc, e.UID ";
            const [result] = await con.query(sql, paymentUID);

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

// 사용자가 구매한 상품들 조회
api.get('/product/:userUID',
    verifyToken,
    async function (req, res, next) {
        try{
            const userUID = req.params.userUID;
            const currentPage = req.query.page ? parseInt(req.query.page) : 1;
            var sql = "select a.UID as paymentUID, e.imgPath, c.korName, c.engName, c.originPrice, c.discountRate, c.discountPrice, d.optionName, a.regDate, a.merchantUid, a.amount, b.count, a.orderStatus, a.shippingStatus " +
                "from payment a " +
                "join payment_product_list b on a.UID = b.paymentUID " +
                "join product c on b.productUID = c.UID " +
                "join product_option_list d on c.UID = d.productUID " +
                "join product_img_list e on c.UID = e.productUID " +
                "where a.userUID = ? and a.type = 'product' " +
                "group by a.UID " +
                "order by a.regDate desc, e.UID ";

            const sqlData = [userUID, userUID];

            var countSql = sql + ";";

            const offset = parseInt(currentPage - 1) * pageCnt10;
            sql += ` limit ${offset}, ${pageCnt10}`;

            const [result] = await con.query(countSql + sql, sqlData);
            const {
                startPage,
                endPage,
                totalPage
            } = getPageInfo(currentPage, result[0].length, pageCnt10);

            res.status(200).json({
                status: 200,
                data: {
                    paging: {
                        startPage: startPage,
                        endPage: endPage,
                        totalPage: totalPage
                    },
                    result: result[1]
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 취소정보 조회
api.get('/refund',
    verifyAdminToken,
    async function (req, res, next) {
        try{
            const status = req.query.status ? req.query.status : '';
            const searchType = req.query.searchType ? req.query.searchType : '';
            const searchWord = req.query.searchWord ? req.query.searchWord : '';
            const startDate = req.query.startDate ? req.query.startDate : '';
            const endDate = req.query.endDate ? req.query.endDate : '';
            const currentPage = req.query.page ? parseInt(req.query.page) : 1;
            const offset = parseInt(currentPage - 1) * pageCnt15;

            const countRes = await selectPaymentRefundStatus(status, searchType, searchWord, startDate, endDate);
            const totalCnt = countRes.totalCnt;
            const refReqCnt = countRes.refReqCnt;
            const refOkCnt = countRes.refOkCnt;
            const refNoCnt = countRes.refNoCnt;

            const result = await selectPaymentRefund(status, searchType, searchWord, startDate, endDate, offset);
            const {
                startPage,
                endPage,
                totalPage
            } = getPageInfo(currentPage, totalCnt, pageCnt15);

            res.status(200).json({
                status: 200,
                data: {
                    paging: {
                        startPage: startPage,
                        endPage: endPage,
                        totalPage: totalPage
                    },
                    status: {
                        totalCnt: totalCnt,
                        refReqCnt: refReqCnt,
                        refOkCnt: refOkCnt,
                        refNoCnt: refNoCnt
                    },
                    result: result
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 미처리 취소요청 조회
api.get('/refund/incomplete',
    verifyAdminToken,
    async function (req, res, next) {
        try{
            var sql = "select count(UID) as cnt from payment where orderStatus = '취소요청'";
            const [result] = await con.query(sql);

            res.status(200).json({
                status: 200,
                data: result[0].cnt,
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// 결제 상세 정보 조회
api.get('/:paymentUID',
    verifyAdminToken,
    async function (req, res, next) {
        try{
            const paymentUID = req.params.paymentUID;
            var sql = "select a.requireMents, if(a.reqDate = '0000-01-01 00:00:00', '', a.reqDate) as reqDate, ifnull(a.refundMsg, '') as refundMsg, a.buyerName, a.buyerTel, " +
                "if(a.shipResDate = '0000-01-01 00:00:00', '', a.shipResDate) as shipResDate, a.shipResMsg, c.korName as productName, d.optionName " +
                "from payment a " +
                "join payment_product_list b on a.UID = b.paymentUID " +
                "join product c on b.productUID = c.UID " +
                "join product_option_list d on b.optionUID = d.UID " +
                "where a.UID = ?";
            const [result] = await con.query(sql, paymentUID);

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

// 정기결제
api.post("/billings", async (req, res) => {
    try {
        const customer_uid = req.body.customer_uid;
        const merchant_uid = req.body.merchant_uid;
        const imp_uid = req.body.imp_uid;
        const paymentData = await getPaymentData(imp_uid);
        const custom_data = paymentData.custom_data ? JSON.parse(paymentData.custom_data) : '';
        const name = paymentData.name ? paymentData.name : '';
        const amount = paymentData.amount ? parseInt(paymentData.amount) : 0;
        const payType = custom_data.payType;
        const buyerEmail = paymentData.buyer_email ? paymentData.buyer_email : '';
		const buyerTel = paymentData.buyer_tel ? paymentData.buyer_tel : '';

        if (payType == "coupon" && name == "single") {
            // 앱 출시 이후에는 첫 달만 무료이고 그 이후부터는 정기 구독료 납부해야하므로 이 코드 실행
            //appendFreeMembership(imp_uid, customer_uid, name, amount, custom_data, buyerEmail, buyerTel);
            res.status(200).json({
                status: 200,
                data: "true",
                message: "결제 승인 성공"
            });
        } else {
            var result = await payForMembership(customer_uid, name, amount, custom_data, buyerEmail, buyerTel);
            if (result.status == 200)
                res.status(200).json(result);
            else
                res.status(403).json(result);
        }
    } catch (e) {
        res.status(400).send(e);
    }
});

// 결제 승인, 예약결제가 시도되었을 때의 웹훅(Notification)
api.post("/iamport-webhook", async function (req, res) {
    try {
        const imp_uid = req.body.imp_uid;
        const merchant_uid = req.body.merchant_uid;
        const paidId = merchant_uid.substr(0, 1);
        const paymentData = await getPaymentData(imp_uid);
        const status = paymentData.status;

        if (status == "paid") { // 결제 성공적으로 완료
            await savePayment(paidId, paymentData);
        } else if (status == "cancelled") {
            await refundPayment(amount, merchant_uid);
        }

        res.status(200).send("success");
    } catch (e) {
        res.status(400).send(e);
    }
});

// 인앱결제 첫 결제 정보 저장
api.post("/inapp",
    verifyToken,
    [
        check("userUID", "userUID is required").not().isEmpty(),
        check("receipt", "receipt is required").not().isEmpty()
    ],
    async (req, res) => {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const userUID = req.body.userUID;
                const receipt = req.body.receipt;
                const excludeOldTransactions = true; // 최신 갱신 트랜잭션만 포함
                const verifiedReceipt = await verifyReceipt(receipt, excludeOldTransactions);

                if(verifiedReceipt.status != 0){ // 유효하지 않은 영수증일 경우
                    res.status(403).json({
                        status: 403,
                        data: "false",
                        message: "fail"
                    });	
                    return false;
                }

                await insertAppleInApp(userUID, verifiedReceipt, res);

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

// app-store 인앱결제 구독 갱신 정보 저장
api.post("/app-store/v1", async (req, res) => {
    try {
        const notificationType = req.body.notification_type;
        console.log(notificationType);
        if (notificationType == "DID_RENEW") { // 자동 갱신
            const receiptData = req.body.unified_receipt.latest_receipt;
            const excludeOldTransactions = true;
            const verifiedReceipt = await verifyReceipt(receiptData, excludeOldTransactions);

            if(verifiedReceipt.status != 0){ // 유효하지 않은 영수증일 경우
                res.status(403).json({
                    status: 403,
                    data: "false",
                    message: "fail"
                });	
                return false;
            }

            const originalTransactionId = verifiedReceipt.latest_receipt_info[0].original_transaction_id;
            const userUID = await selectAppleUserUID(originalTransactionId);
            if(userUID == 0){
                res.status(403).json({
                    status: 403,
                    data: "false",
                    message: "사용자 정보를 찾을 수 없습니다." // 예외 처리 - 메시지 수정
                });	
                return false;
            }

            await insertAppleInApp(userUID, verifiedReceipt, res);

            res.status(200).json({
                status: 200,
                data: "true",
                message: "success"
            });
        }
    } catch (e) {
        res.status(400).send(e);
    }
});

// 배송 예약 등록
api.put('/ship/schedule/:paymentUID',
    verifyAdminToken,
    async function (req, res, next) {
        try{
            const paymentUID = req.params.paymentUID;
            const shipResDate = req.body.date;
            const shipResMsg = req.body.msg;
            var sql = "update payment " +
                "set shipResDate = ?, shipResMsg = ?, shippingStatus='배송준비중' " +
                "where UID = ?";
            const sqlData = [shipResDate, shipResMsg, paymentUID];
            await con.query(sql, sqlData);

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

// 배송 완료
api.put('/ship/complete/:paymentUID',
    verifyAdminToken,
    async function (req, res, next) {
        try{
            const paymentUID = req.params.paymentUID;
            const shipConfDate = req.body.date;
            const shipConfMsg = req.body.msg;
            const shipRcpnt = req.body.recipient;

            var sql = "update payment " +
                "set shipConfDate = ?, shipConfMsg = ?, shipRcpnt = ?, shippingStatus='배송완료' " +
                "where UID = ?";
            const sqlData = [shipConfDate, shipConfMsg, shipRcpnt, paymentUID];
            await con.query(sql, sqlData);

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

// 이니시스에 환불 요청
api.put("/refund/complete/:paymentUID", async function (req, res) {
    try {
        const paymentUID = req.params.paymentUID;
        const refConfMsg = req.body.refConfMsg;
        const orderStatus = req.body.orderStatus;
        var sql = "select merchantUid, impUid, amount, refundMsg from payment where UID = ?";
        const [result] = await con.query(sql, paymentUID);
        
        if(result.length == 0){
             // status code 의논 필요
            res.status(200).json({
                status: 200,
                data: "true",
                message: "db에 존재하지 않는 데이터입니다."
            });

            return false;
        }

        const amount = result[0].amount;
        const merchantUid = result[0].merchantUid;
        const impUid = result[0].impUid;
        const refundMsg = result[0].refundMsg;

        if (orderStatus == "취소승인") { // 취소승인일 때만 환불 처리
            await refundFromIamport(refundMsg, impUid, amount);
            await refundPayment(amount, merchantUid);
        }
        await completeRefund(refConfMsg, orderStatus, paymentUID);

        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (e) {
        res.status(400).send(e);
    }
});

// 멤버십 예약 취소
api.put("/membership/unschedule/:paymentUID", async function (req, res) {
    try {
        const paymentUID = req.params.paymentUID;

        var sql = "select customerUid from payment where UID = ? and type = 'membership' order by regDate desc limit 1";
        const [result] = await con.query(sql, paymentUID);

        if(result.length == 0){
            // status code 의논 필요
            res.status(200).json({
                status: 200,
                data: "true",
                message: "db에 존재하지 않는 데이터입니다."
            });
            return false;
        }

        const customerUid = result[0].customerUid;
        const scheduleData = await getScheduledData(customerUid);
        const merchantUid = scheduleData[0].merchant_uid;
        if(scheduleData.length != 0){
            await unscheduleFromIamport(customerUid, merchantUid);
        }

        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (e) {
        res.status(400).send(e);
    }
});

// 취소 요청
api.put('/refund/:paymentUID', verifyToken, async function (req, res) {
    try{
        const paymentUID = req.params.paymentUID;
        const refundMsg = req.body.refundMsg;

        var sql = "update payment set refundMsg = ?, orderStatus='취소요청', reqDate = now() where UID = ?";
        const sqlData = [refundMsg, paymentUID];
        await con.query(sql, sqlData);

        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

async function selectPaymentSales(type, searchType, searchWord, startDate, endDate) {
    var sql = "select ifnull(sum(a.amount), 0) as totalPrice, count(a.UID) as totalCount, ifnull(sum(case when a.orderStatus = '취소승인' then a.amount end ), 0) as refundPrice, " +
        "count(case when a.orderStatus = '취소승인' then 1 end ) as refundCount " +
        ", ifnull(sum(case when a.orderStatus != '취소승인' then a.amount end ), 0) as profitPrice, count(case when a.orderStatus != '취소승인' then 1 end ) as profitCount " +
        "from payment a " +
        "join user b on a.userUID = b.UID " +
        `where (date_format(a.regDate, '%Y-%m-%d') between '${startDate}' and '${endDate}') `;

    sql += `and a.type = '${type}' `;

    // 검색
    if (searchType.length != 0) {
        if (searchType == "buyerEmail") {
            sql += "and b.email ";
        } else if (searchType == "buyerTel") {
            sql += "and b.cellNumber ";
        } else if (searchType == "merchantUid") {
            sql += "and a.merchantUid ";
        }

        sql += `LIKE '%${searchWord}%' `;
    }

    const [result] = await con.query(sql);
    console.log(result);
    return result[0];
}

async function selectPaymentProduct(type, searchType, searchWord, startDate, endDate, offset) {
    var sql = "select a.UID as paymentUID, a.merchantUid, c.korName, d.optionName, a.buyerEmail, e.cellNumber as buyerTel, a.amount, " +
        "a.payMethod, a.orderStatus, a.regDate " +
        "from payment a " +
        "join payment_product_list b on a.UID = b.paymentUID " +
        "join product c on b.productUID = c.UID " +
        "join product_option_list d on b.optionUID = d.UID " +
        "join user e on a.userUID = e.UID " +
        `where (date_format(a.regDate, '%Y-%m-%d') between '${startDate}' and '${endDate}') `;

    sql += `and a.type = '${type}' `;

    // 검색
    if (searchType.length != 0) {
        if (searchType == "buyerEmail") {
            sql += "and e.email ";
        } else if (searchType == "buyerTel") {
            sql += "and e.cellNumber ";
        } else if (searchType == "merchantUid") {
            sql += "and a.merchantUid ";
        }

        sql += `LIKE '%${searchWord}%' `;
    }

    sql += "group by a.UID " +
        "order by a.regDate desc " +
        `limit ${offset}, ${pageCnt15}`;
    const [result] = await con.query(sql);
    return result;
}

async function selectPaymentMembership(type, searchType, searchWord, startDate, endDate, offset) {
    var sql = "select a.UID as paymentUID, a.merchantUid, if(b.optionUID = 0, '-', '') as optionName, c.level as korName, a.buyerEmail, d.cellNumber as buyerTel, " +
        "a.amount, a.payMethod, a.orderStatus, a.regDate " +
        "from payment a " +
        "join payment_product_list b on a.UID = b.paymentUID " +
        "join membership c on b.membershipUID = c.UID " +
        "join user d on c.userUID = d.UID " +
        `where (date_format(a.regDate, '%Y-%m-%d') between '${startDate}' and '${endDate}') `;

    sql += `and a.type = '${type}' `;

    // 검색
    if (searchType.length != 0) {
        if (searchType == "buyerEmail") {
            sql += "and d.email ";
        } else if (searchType == "buyerTel") {
            sql += "and d.cellNumber ";
        } else if (searchType == "merchantUid") {
            sql += "and a.merchantUid ";
        }

        sql += `LIKE '%${searchWord}%' `;
    }

    sql += "group by a.UID " +
        "order by a.regDate desc " +
        `limit ${offset}, ${pageCnt15}`;

    const [result] = await con.query(sql);
    return result;
}

async function selectPaymentShipStatus(status, searchType, searchWord, startDate, endDate){
    var sql = "select count(a.UID) as totalCnt, count(case when a.shippingStatus = '배송전'  then 1 end ) as befShipCnt,  count(case when a.shippingStatus = '배송준비중'  then 1 end ) as rdyShipCnt, " +
            "count(case when a.shippingStatus = '배송완료'  then 1 end ) as confShipCnt " +
            "from payment a " +
            "join user b on a.userUID = b.UID " +
            `where (date_format(a.regDate, '%Y-%m-%d') between '${startDate}' and '${endDate}') and a.type = 'product' and a.orderStatus != '취소요청' and a.orderStatus != '취소승인' `;

    if (status != "all") 
        sql += `and a.shippingStatus = '${status}' `;
    
    // 검색
    if (searchType.length != 0) {
        if (searchType == "buyerEmail") {
            sql += "and b.email ";
        } else if (searchType == "buyerTel") {
            sql += "and a.buyerTel ";
        } else if (searchType == "merchantUid") {
            sql += "and a.merchantUid ";
        }

        sql += `LIKE '%${searchWord}%' `;
    } 

    const [result] = await con.query(sql);

    return result[0];
}

async function selectPaymentShip(status, searchType, searchWord, startDate, endDate, offset) {
    var sql = "select a.UID as paymentUID, a.merchantUid, c.korName, d.optionName, a.buyerName, a.buyerEmail, a.buyerTel, " +
        "concat(a.addr1, ' ', a.addr2) as addr, a.regDate, a.shippingStatus, if(a.shipResDate = '0000-01-01 00:00:00', '', a.shipResDate) as shippingDate, " +
        "if(shipConfDate = '0000-01-01 00:00:00', '', shipConfDate) as shipConfDate " +
        "from payment a " +
        "join payment_product_list b on a.UID = b.paymentUID " +
        "join product c on b.productUID = c.UID " +
        "join product_option_list d on b.optionUID = d.UID " +
        "join user e on a.userUID = e.UID " +
        `where (date_format(a.regDate, '%Y-%m-%d') between '${startDate}' and '${endDate}') and a.type = 'product' and a.orderStatus != '취소요청' and a.orderStatus != '취소승인' `;

    if (status != "all")
        sql += `and a.shippingStatus = '${status}' `;

    // 검색
    if (searchType.length != 0) {
        if (searchType == "buyerEmail") {
            sql += "and e.email ";
        } else if (searchType == "buyerTel") {
            sql += "and a.buyerTel ";
        } else if (searchType == "merchantUid") {
            sql += "and a.merchantUid ";
        }

        sql += `LIKE '%${searchWord}%' `;
    }

    sql += "group by a.UID " +
        "order by a.regDate desc" +
        ` limit ${offset}, ${pageCnt15}`;

    const [result] = await con.query(sql);
    return result;
}

async function selectPaymentRefundStatus(status, searchType, searchWord, startDate, endDate){
    var sql = "select count(a.UID) as totalCnt, count(case when a.orderStatus = '취소요청'  then 1 end ) as refReqCnt,  count(case when a.orderStatus = '취소승인'  then 1 end ) as refOkCnt, " +
    "count(case when a.orderStatus = '취소미승인'  then 1 end ) as refNoCnt " +
    "from payment a " +
    "join user b on a.userUID = b.UID " +
    `where a.orderStatus != '결제완료' and a.type = 'product' and (date_format(a.reqDate, '%Y-%m-%d') between '${startDate}' and '${endDate}') `;

    if (status != "all")
        sql += `and a.orderStatus = '${status}' `;

    // 검색
    if (searchType.length != 0) {
        if (searchType == "buyerEmail") {
            sql += "and b.email ";
        } else if (searchType == "buyerTel") {
            sql += "and b.cellNumber ";
        } else if (searchType == "merchantUid") {
            sql += "and a.merchantUid ";
        }

        sql += `LIKE '%${searchWord}%' `;
    }

    const [result] = await con.query(sql);
    return result[0];
}

async function selectPaymentRefund(status, searchType, searchWord, startDate, endDate, offset){
    var sql = "select a.UID as paymentUID, a.merchantUid, d.korName, e.optionName, a.buyerName, a.buyerEmail, a.buyerTel, ifnull(a.refundMsg, '') as refundMsg, " +
    "ifnull(a.refConfMsg, '') as refConfMsg, orderStatus, if(a.reqDate = '0000-01-01 00:00:00', '', a.reqDate) as reqDate, if(a.refConfDate = '0000-01-01 00:00:00', '', a.refConfDate) as refConfDate " +
    "from payment a " +
    "join user b on a.userUID = b.UID " +
    "join payment_product_list c on a.UID = c.paymentUID " +
    "join product d on c.productUID = d.UID " +
    "join product_option_list e on c.optionUID = e.UID " +
    `where a.type = 'product' and (date_format(a.reqDate, '%Y-%m-%d') between '${startDate}' and '${endDate}') and a.orderStatus != '결제완료' `;

    // 검색
    if (searchType.length != 0) {
        if (searchType == "buyerEmail") {
            sql += "and b.email ";
        } else if (searchType == "buyerTel") {
            sql += "and b.cellNumber ";
        } else if (searchType == "merchantUid") {
            sql += "and a.merchantUid ";
        }

        sql += `LIKE '%${searchWord}%' `;
    }

    sql += "group by a.UID " +
            "order by a.reqDate desc " +
            `limit ${offset}, ${pageCnt15}`;

    const [result] = await con.query(sql);
    return result;
}

// 미러를 구매여부 조회
async function isPurchaseMirror(userUID){
    var sql = "select a.UID " +
    "from payment a " +
    "join payment_product_list b on a.UID = b.paymentUID " +
    "where a.userUID = ? and a.paymentStatus != 'cancelled' and orderStatus = '결제완료' and a.type = 'product' and b.productUID = 1 " +
    "order by a.regDate " +
    "limit 1";
    const [result] = await con.query(sql, userUID);
    
    if(result.length == 0)
        return false;
    else    
        return true;
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

// 아임포트 - 멤버십 구독 예약
async function scheduleMembership(customer_uid, laterNum, amount, name, custom_data, email, cellNum) {
    const access_token = await getToken();

    await axios({
        url: "https://api.iamport.kr/subscribe/payments/schedule",
        method: "post",
        headers: {
            "Authorization": access_token
        },
        data: {
            customer_uid: customer_uid, // 카드(빌링키)와 1:1로 대응하는 값
            schedules: [{
                buyer_email: email,
				buyer_tel: cellNum,
                merchant_uid: generateMerchantUid("3", name), // 새로 생성한 예약용 주문 번호 주문 번호
                schedule_at: getNextDateTime(laterNum), // 결제 시도 시각 in Unix Time Stamp
                amount: amount,
                name: name,
                custom_data: custom_data
            }]
        }
    });
}

// 멤버십 무료 제공
async function appendFreeMembership(imp_uid, customer_uid, name, custom_data, email, cellNum) {
    delete custom_data.payType;

    var amount = 9900;
    const laterNum = 3; //3달 무료로 멤버십 제공

    await scheduleMembership(customer_uid, laterNum, amount, name, custom_data, email, cellNum);
}

// 아임포트 - 멤버십 결제
async function payForMembership(customer_uid, name, amount, custom_data, email, cellNum) {
    // 인증 토큰 발급 받기
    const access_token = await getToken();

    // 재결제
    const paymentResult = await axios({
        url: 'https://api.iamport.kr/subscribe/payments/again',
        method: "post",
        headers: {
            "Authorization": access_token
        },
        data: {
            customer_uid: customer_uid,
            merchant_uid: generateMerchantUid("2", name), // 새로 생성한 결제(재결제)용 주문 번호
            amount: amount,
            name: name,
            custom_data: custom_data
        }
    });

    const code = paymentResult.data.code;
    const message = paymentResult.data.message; // 카드 승인 실패에 대한 메시지

    if (code === 0) { // 카드사 통신에 성공(실제 승인 성공 여부는 추가 판단이 필요함)
        if (paymentResult.data.response.status == "paid") { //카드 정상 승인
            // 새로운 결제 예약
            const laterNum = 1; // 한 달 후 다시 결제
            await scheduleMembership(customer_uid, laterNum, amount, name, custom_data, email, cellNum);

            return {
                status: 200,
                data: "true",
                message: "결제 승인 성공"
            };

        } else {
            return {
                status: 403,
                data: "false",
                message: "승인 결제 실패"
            }; //카드 승인 실패 (예: 고객 카드 한도초과, 거래정지카드, 잔액부족 등)
        }
    } else {
        return {
            status: 403,
            data: "false",
            message: "카드사 요청 실패"
        }; // 카드사 요청에 실패 (paymentResult is null)
    }
}

// 아임포트 - 결제 정보 조회
async function getPaymentData(imp_uid) {
    // 인증 토큰 발급 받기
    const access_token = await getToken();
    const paymentData = await axios({
        url: `https://api.iamport.kr/payments/${imp_uid}`,
        method: "get", // GET method
        headers: {
            "Authorization": access_token
        }
    });

    return paymentData.data.response;
}

// 관리자 - 결제 환불 처리
async function refundPayment(amount, merchantUid) {
    var sql = "update payment set refundAmount = ?, paymentStatus = 'cancelled', orderStatus = '취소승인' where merchantUid = ?";
    var sqlData = [amount, merchantUid];
    await con.query(sql, sqlData);
}

// 관리자 - 결제 환불 완료 처리
async function completeRefund(refConfMsg, orderStatus, paymentUID) {
    var sql = "update payment " +
        "set refConfMsg = ?, orderStatus = ?, refConfDate = now() " +
        "where UID = ?";
    const sqlData = [refConfMsg, orderStatus, paymentUID];
    await con.query(sql, sqlData);
}

// 아임포트 - 결제 환불
async function refundFromIamport(refundMsg, impUid, refundAmount) {
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
            reason: refundMsg, // 가맹점 클라이언트로부터 받은 환불사유
            imp_uid: impUid, // imp_uid를 환불 `unique key`로 입력
            amount: refundAmount, // 가맹점 클라이언트로부터 받은 환불금액
            checksum: refundAmount // [권장] 환불 가능 금액 입력
        }
    });

    return getCancelData.data.response;
}

// 3개월 내에 예약된 정기결제 조회
async function getScheduledData(customerUid) {
    const access_token = await getToken();

    const scheduledData = await axios({
        url: `https://api.iamport.kr/subscribe/payments/schedule/customers/${customerUid}`,
        method: "get", // GET method
        headers: {
            "Authorization": access_token
        },
        params: {
            from: getNextDateTime(0),
            to: getNextDateTime(3)
        }
    });

    const status = scheduledData.status;

    if(status == 200) // 3개월 내의 예약된 정기결제 존재
        return scheduledData.data.response.list;
    else    
        return [];
}

// 아임포트 구독 예약 취소 (멤버십 해지)
async function unscheduleFromIamport(customerUid, merchantUid) {
    const access_token = await getToken();

    await axios({
        url: "https://api.iamport.kr/subscribe/payments/unschedule",
        method: "post",
        headers: {
            "Content-Type": "application/json",
            "Authorization": access_token // 아임포트 서버로부터 발급받은 엑세스 토큰
        },
        data: {
            customer_uid: customerUid, // 가맹점 클라이언트로부터 받은 환불사유
            merchant_uid: merchantUid, // imp_uid를 환불 `unique key`로 입력
        }
    });
}

// 주문번호 생성
function generateMerchantUid(startNo, level) {
    var merchantUid = startNo;

    switch (level) {
        case "single":
            merchantUid += "001";
            break;
        case "friends":
            merchantUid += "002";
            break;
        case "family":
            merchantUid += "003";
            break;
        case "mobile":
            merchantUid += "004";
            break;
    }

    return merchantUid + Math.floor(Date.now() / 1000) + generateRandomNumber(3);
}

// 결제 완료 메일 전송
async function sendPaymentEmail(email, paymentUID) {
    var sql = 'select product_img_list.imgPath, product.korName, product.originPrice, product.discountPrice, payment.merchantUid, payment.amount, product.originShippingFee, product.dcShippingFee ' +
        'from payment ' +
        'join payment_product_list on payment.UID = payment_product_list.paymentUID ' +
        'join product on payment_product_list.productUID = product.UID ' +
        'join product_option_list on product.UID = product_option_list.productUID ' +
        'join product_img_list on product.UID = product_img_list.productUID ' +
        'where payment.UID = ? ' +
        'group by payment.UID ' +
        'order by payment.regDate desc, product_img_list.UID';
    const [result] = await con.query(sql, paymentUID);

    sendPaymentMail(result, email);
}

// 주문 정보 추가
async function insertPayment(sqlData) {
    var sql = "insert payment(userUID, amount, addr1, addr2, requireMents, applyNum, bankName, buyerAddr, buyerEmail, buyerName, buyerPostcode, " +
        "buyerTel, cardName, cardNumber, cardQuota, currency, customerUid, impUid, " +
        "merchantUid, name, paidAt, payMethod, pgTid, pgType, receiptUrl, paymentStatus, type) " +
        "values (?)";
    const [result] = await con.query(sql, [sqlData]);
    
    return result.insertId;
}

// 주문에 대한 상품 정보 추가
async function insertPaymentProduct(paymentUID, productUID, optionUID, count, buyerEmail) {
    var sql = "insert payment_product_list(paymentUID, productUID, optionUID, count) values (?)";
    const sqlData = [paymentUID, productUID, optionUID, count];
    await con.query(sql, [sqlData]);

    sendPaymentEmail(buyerEmail, paymentUID);
}

// 주문에 대한 멤버십 정보 추가
async function insertPaymentMembership(paymentUID, membershipUID) {
    var sql = "insert payment_product_list(paymentUID, membershipUID) values (?)";
    const sqlData = [paymentUID, membershipUID];
    await con.query(sql, [sqlData]);
}


// 멤버십 정보 업데이트
async function updateMembership(level, laterNum, membershipUID, paymentUID) {
    var sql = "update membership set level = ?, endDate = date_add(now(), interval ? month), paymentUID = ? where UID = ?";
    const sqlData = [level, laterNum, paymentUID, membershipUID];
    await con.query(sql, sqlData);
}

// 멤버십 정보 추가
async function insertMembership(userUID, level, laterNum, paymentUID) {
    var sql = "insert membership(userUID, level, endDate, paymentUID) values (?, ?, date_add(addtime(curdate(), '23:59:59'), interval ? month), ?)";
    const sqlData = [userUID, level, laterNum, paymentUID];
    const [result] = await con.query(sql, sqlData);
    const membershipUID = result.insertId;
    insertOrderMembership(paymentUID, membershipUID);
}

// membership 정보 추가/업데이트
async function selectMembershipUID(userUID) {
    var sql = "select UID, endDate from membership where userUID = ?";
    const [result] = await con.query(sql, userUID);

    if(result.length != 0)
        return result[0];
    else    
        return 0;
}

// memverhip.js와 login.js에서도 사용하는 함수
async function selectMembership(userUID) {
    var sql = "select UID, level, startDate, endDate from membership " +
        "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and userUID = ?";
    const [result] = await con.query(sql, userUID);

    if (result.length != 0)
        return {
            UID: result[0].UID,
            level: result[0].level,
            startDate: result[0].startDate,
            endDate: result[0].endDate
        };
    else
        return {
            UID: 0,
            level: "normal",
            startDate: "0000-01-01 00:00:00",
            endDate: "0000-01-01"
        };
}

// 장바구니에서 삭제
async function deleteMyBasket(myBasketUID) {
    var myBasketUID = parseInt(myBasketUID);
    if (myBasketUID != -1) {
        var sql = "delete from my_basket where UID = ?";
        await con.query(sql, myBasketUID);
    }
}

// 주문 정보 저장
async function savePayment(paidId, paymentData) {
    try{
        // custom_data 파라미터
        const customData = paymentData.custom_data ? JSON.parse(paymentData.custom_data) : '';
        const userUID = customData.userUID ? parseInt(customData.userUID) : 0;
        const productUID = customData.productUID ? parseInt(customData.productUID) : 0;
        const optionUID = customData.optionUID ? parseInt(customData.optionUID) : 0;
        const addr1 = customData.addr1 ? customData.addr1 : '';
        const addr2 = customData.addr2 ? customData.addr2 : '';
        const requireMents = customData.requireMents ? customData.requireMents : '';
        const type = customData.type ? customData.type : '';
        const payType = customData.payType ? customData.payType : '';

        // kg 이니시스 기본 파라미터
        const amount = parseInt(paymentData.amount);
        const applyNum = paymentData.apply_num ? paymentData.apply_num : '';
        const bankName = paymentData.bank_name ? paymentData.bank_name : '';
        const buyerAddr = paymentData.buyer_addr ? paymentData.buyer_addr : '';
        const buyerEmail = paymentData.buyer_email ? paymentData.buyer_email : '';
        if (buyerEmail.length == 0) // 주문자 이메일이 존재하지 않으면 다음 코드 실행 불가
            return false;
        const buyerName = paymentData.buyer_name ? paymentData.buyer_name : '';
        const buyerPostcode = paymentData.buyer_postcode ? paymentData.buyer_postcode : '';
        const buyerTel = paymentData.buyer_tel ? paymentData.buyer_tel : '';
        const cardName = paymentData.card_name ? paymentData.card_name : '';
        const cardNumber = paymentData.card_number ? paymentData.card_number : '';
        const cardQuota = paymentData.card_quota ? paymentData.card_quota : '';
        const currency = paymentData.currency ? paymentData.currency : '';
        const customerUid = paymentData.customer_uid ? paymentData.customer_uid : '';
        const impUid = paymentData.imp_uid ? paymentData.imp_uid : '';
        const merchantUid = paymentData.merchant_uid ? paymentData.merchant_uid : '';
        const level = paymentData.name ? paymentData.name : '';
        const paidAt = paymentData.paid_at ? parseInt(paymentData.paid_at) : 0;
        const pgTid = paymentData.pg_tid ? paymentData.pg_tid : '';
        const pgType = paymentData.pg_type ? paymentData.pg_type : '';
        const receiptUrl = paymentData.receipt_url ? paymentData.receipt_url : '';
        const status = paymentData.status ? paymentData.status : '';
        var payMethod = paymentData.pay_method ? paymentData.pay_method : '';
        var laterNum = 1; // 만료날짜 한달 후

        if (payType == "coupon") {
            payMethod = "[미러구매 혜택] 무료 멤버십";
            //laterNum = 1; // 만료날짜 한달 후가 아니라면 숫자 변경
            delete customData.payType;
        }

        if (payMethod == "card")
            payMethod = "신용카드";
        
        // 결제 정보 저장
        const sqlData = [userUID, amount, addr1, addr2, requireMents, applyNum, bankName, buyerAddr, buyerEmail, buyerName, buyerPostcode, buyerTel,
            cardName, cardNumber, cardQuota, currency, customerUid, impUid, merchantUid, level, paidAt, payMethod, pgTid, pgType, receiptUrl, status, type];
        const paymentUID = await insertPayment(sqlData);
        
        if (paidId == "1") { // product
            // 장바구니에서 삭제
            // deleteMyBasket(customData.myBasketUID);
            const count = 1;
            await insertPaymentProduct(paymentUID, productUID, optionUID, count, buyerEmail);
        } 
        else if (paidId == "2") { // membership - 처음 결제
            if (payMethod != "[미러구매 혜택] 무료 멤버십")
                sendMembershipEmail(buyerEmail, level, amount, payMethod, cardNumber);

            const result = await selectMembershipUID(userUID);
            const membershipUID = result.UID;

            if(membershipUID != 0) // 멤버십 구매한 내역 존재
                await updateMembership(level, laterNum, membershipUID, paymentUID);
            else // 멤버십 처음 구매
                await insertMembership(userUID, level, laterNum, paymentUID);
                
            await insertPaymentMembership(paymentUID, membershipUID);
        }   
        else if (paidId == "3") { // membership - 정기 결제
            const result = await selectMembership(userUID);
            const membershipUID = result.UID;
            if(membershipUID > 0){  // 구독하고 있는 멤버십이 있을 경우
                await scheduleMembership(customerUid, laterNum, amount, level, customData, buyerEmail, buyerTel);
                await updateMembership(level, laterNum, membershipUID, paymentUID);
                await insertPaymentMembership(paymentUID, membershipUID); 
            }
        }
    } catch (err) {
        throw err;
    }
}

// 상품 정보 조회
async function selectProduct(productUID){
    var sql = "select engName, originPrice from product where UID = ?";
    const [result] = await con.query(sql, productUID);

    return result;
}

// 회원에 대한 멤버십 UID 조회
async function selectMembershipUID(userUID){
    var sql = "select UID from membership where userUID = ?";
    const [result] = await con.query(sql, userUID);

    if(result.length != 0)
        return result[0].UID;
    else
        return 0;
}

// membership_group.js에서도 사용하는 함수
async function selectEmailFromUID(userUID) {
    var sql = "select email from user where UID = ?";
    const [result] = await con.query(sql, userUID);
    
    if(result.length != 0)
        return result[0].email;
    else
        return '';
}

// 멤버십 정보 업데이트
async function updateAppleMembership(level, membershipUID, endTimestamp, paymentUID) {
    var sql = "update membership set level = ?, endDate = date_format(from_unixtime(?), '%Y-%m-%d 23:59:59'), paymentUID = ? where UID = ?";
    const sqlData = [level, endTimestamp, paymentUID, membershipUID];
    await con.query(sql, sqlData);
}

// 애플 인앱결제 주문에 대한 멤버십 정보 저장
async function insertApplePaymentMembership(paymentUID, membershipUID, paidTimestamp) {
    var sql = "insert payment_product_list(paymentUID, membershipUID, regDate) " +
        "values (?, ?, date_format(from_unixtime(?), '%Y-%m-%d %H:%i:%S'))";
    const sqlData = [paymentUID, membershipUID, paidTimestamp];
    await con.query(sql, sqlData);
}

// 애플 인앱결제 멤버십 정보 저장
async function insertAppleMembership(userUID, level, paymentUID, paidTimestamp, endTimestamp){
    var sql = "insert membership(userUID, level, paymentUID, startDate, endDate) " +
    "values (?, ?, ?, date_format(from_unixtime(?), '%Y-%m-%d %H:%i:%S'), date_format(from_unixtime(?), '%Y-%m-%d 23:59:59'))";
    var sqlData = [userUID, level, paymentUID, paidTimestamp, endTimestamp];
    const [result] = await con.query(sql, sqlData);

    return result.insertId;
}

// 애플 인앱결제 결제 정보 저장
async function insertApplePayment(sqlData) {   
    var sql = "insert payment(userUID, amount, buyerEmail, merchantUid, originalTransactionId, name, paidAt, receiptUrl, type, regDate) " +
        "values (?, ?, ?, ?, ?, ?, ?, ?, ?, date_format(from_unixtime(?), '%Y-%m-%d %H:%i:%S'))";
    const [result] = await con.query(sql, sqlData);
    return result.insertId;
}

// 애플의 originalTransactionId로 userUID 조회
async function selectAppleUserUID(originalTransactionId){
    var sql = "select userUID from payment where originalTransactionId = ? order by regDate desc limit 1";
    const [result] = await con.query(sql, originalTransactionId);

    if(result.length != 0)
        return result[0].userUID;
    else    
        return 0;
}

// sandbox 테스트 영수증 검증
async function verifyTestReceipt(receiptData, excludeOldTransactions) {
    const verifiedTestReceipt = await axios({
        url: "https://sandbox.itunes.apple.com/verifyReceipt",
        method: "post", // POST method
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            "receipt-data": receiptData,
            password: apple_password,
            "exclude-old-transactions": excludeOldTransactions
        }
    });

    return verifiedTestReceipt.data;
}

// product 실제 영수증 검증
async function verifyReceipt(receiptData, excludeOldTransactions) {
    const verifiedReceipt = await axios({
        url: "https://buy.itunes.apple.com/verifyReceipt",
        method: "post", // POST method
        headers: {
            "Content-Type": "application/json"
        },
        data: {
            "receipt-data": receiptData,
            password: apple_password,
            "exclude-old-transactions": excludeOldTransactions
        }
    });

    if (verifiedReceipt.data.status == 21007) // 21007은 샌드박스 테스트할 때의 status code
        return await verifyTestReceipt(receiptData, excludeOldTransactions);
    else
        return verifiedReceipt.data;
}

// 애플 인앱결제 정보들 저장
async function insertAppleInApp(userUID, verifiedReceipt, res){
    const receiptData = verifiedReceipt.latest_receipt;
    const latestReceipt = verifiedReceipt.latest_receipt_info[0];
    const productId = latestReceipt.product_id;
    const originalTransactionId = latestReceipt.original_transaction_id;
    const transactionId = latestReceipt.transaction_id;
    const paidTimestamp = latestReceipt.purchase_date_ms / 1000;
    const endTimestamp = latestReceipt.expires_date_ms / 1000;
    const type = 'membership';

    const productRes = await selectProduct(productId);
    if(productRes.length == 0){
        res.status(403).json({
            status: 403,
            data: "false",
            message: "상품 정보를 찾을 수 없습니다." // 예외 처리 - 메시지 수정 
        });	
        return false;
    }
    const level = productRes[0].engName;
    const price = productRes[0].originPrice;

    const buyerEmail = await selectEmailFromUID(userUID);
    if(buyerEmail.length == 0){
        res.status(403).json({
            status: 403,
            data: "false",
            message: "가입되어 있지 않은 회원입니다." // 예외 처리 - 메시지 수정
        });
        return false;
    }

    const sqlData = [userUID, price, buyerEmail, transactionId, originalTransactionId, level, paidTimestamp, receiptData, type, paidTimestamp];
    const paymentUID = await insertApplePayment(sqlData);
    var membershipUID = await selectMembershipUID(userUID);

    if(membershipUID == 0) // 멤버십 첫 구매일 경우
        membershipUID = await insertAppleMembership(userUID, level, paymentUID, paidTimestamp, endTimestamp);
    else // 멤버십 구매내역이 있을 경우
        await updateAppleMembership(level, membershipUID, endTimestamp, paymentUID);

    await insertApplePaymentMembership(paymentUID, membershipUID, paidTimestamp);
}

async function selectWeekProduct(){
    var sql = "select date_format(regDate, '%Y-%m-%d') as date, count(UID) as count " +
                "from payment " +
                "where type='product' and regDate between date_format(date_add(now(), interval -6 day), '%Y-%m-%d') and date_format(date_add(now(), interval 1 day), '%Y-%m-%d') " +
                "group by date_format(regDate, '%Y-%m-%d')";
    const [result] = await con.query(sql);
    return result;
}

async function selectWeekMembership(){
    var sql = "select date_format(regDate, '%Y-%m-%d') as date, count(UID) as count " +
                "from payment " +
                "where type='membership' and regDate between date_format(date_add(now(), interval -6 day), '%Y-%m-%d') and date_format(date_add(now(), interval 1 day), '%Y-%m-%d') " +
                "group by date_format(regDate, '%Y-%m-%d')";
    const [result] = await con.query(sql);
    return result;
}

module.exports = api;
