const express = require('express');
const db = require('./config/database.js');
const api = express.Router();
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const axios = require('axios');
const {toHypenDateTimeFormat, toHypenDateFormat} = require('./config/toDateFormat.js');
const {generateRandomNumber} = require('./config/generateRandomNumber.js');
const {getPageInfo} = require('./config/paging.js'); 
const {getCurrentDateTime, getNextDateTime} = require('./config/date.js');
const {sendPaymentMail, sendMembershipEmail} = require('./config/mail.js');
const {addCellSearchSql} = require('./config/searchSql.js');
const imp_key = "7260030924750208"; // REST API 키
const imp_secret = "abc8d306c8df0b4354dd438c5ab9d5af9bf06094734cc1936780beef5fa4a6ab585b1219b7b09a4b"; // REST API Secret
//const imp_key = "5425471433410805"; // 테스트 REST API 키
//const imp_secret = "L76UxuB5wmV0TRtcRR3iBYiGz38AOiTAq0uXu630tY1mPuzHmC0YBiEamNLa6FLwFfu9mxaPwccmGL33"; // 테스트 REST API Secret
const pageCnt15 = 15;
const pageCnt10 = 10;

// 주문정보 조회
api.get('/', 
		verifyAdminToken, 
		function (req, res, next) {
			var type = req.query.type;
			var searchType = req.query.searchType;
			var searchWord = req.query.searchWord;
			var startDate = req.query.startDate;
			var endDate = req.query.endDate;

			var countSql = "select ifnull(sum(amount), 0) as totalPrice, count(*) as totalCount, ifnull(sum(case when orderStatus = '취소승인' then amount end ), 0) as refundPrice, count(case when orderStatus = '취소승인' then 1 end ) as refundCount "
						 + ", ifnull(sum(case when orderStatus != '취소승인' then amount end ), 0) as profitPrice, count(case when orderStatus != '취소승인' then 1 end ) as profitCount "
						 + "from payment "
						 + "join user on payment.userUID = user.UID "
						 + "where (date_format(payment.regDate, '%Y-%m-%d') between ? and ?) ";

			var productSql = "select payment.UID as paymentUID, payment.merchantUid, product.korName, product_option_list.optionName, payment.buyerEmail, user.cellNumber as buyerTel, payment.amount, "
						   + "payment.payMethod, payment.orderStatus, payment.regDate "
						   + "from payment "
						   + "join payment_product_list on payment.UID = payment_product_list.paymentUID "
						   + "join product on payment_product_list.productUID = product.UID "
						   + "join product_option_list on payment_product_list.optionUID = product_option_list.UID "
						   + "join user on payment.userUID = user.UID "
						   + "where date_format(payment.regDate, '%Y-%m-%d') between ? and ? ";

			var membershipSql = "select payment.UID as paymentUID, payment.merchantUid, if(payment_product_list.optionUID = 0, '-', '') as optionName, membership.level as korName, payment.buyerEmail, user.cellNumber as buyerTel, payment.amount, payment.payMethod, payment.orderStatus, payment.regDate "
							  + "from payment "
							  + "join payment_product_list on payment.UID = payment_product_list.paymentUID "
							  + "join membership on payment_product_list.productUID = membership.UID "
							  + "join user on membership.userUID = user.UID "
							  + "where date_format(payment.regDate, '%Y-%m-%d') between ? and ? ";

			var sql = "";
			if (type == "product")
				sql = productSql;
			else if (type == "membership")
				sql = membershipSql;
					
			sql += "and payment.type = '" + type + "' ";
			countSql += "and payment.type = '" + type + "' ";

			
			sql += addCellSearchSql(searchType, searchWord, "user");
			countSql += addCellSearchSql(searchType, searchWord, "user");

			sql += "group by payment.UID "
				+ "order by payment.regDate desc";

			countSql += ";";

			sql += " limit ?, " + pageCnt15;
			var data = [startDate, endDate, startDate, endDate];
			var currentPage = req.query.page ? parseInt(req.query.page) : 1;
			data.push(parseInt(currentPage - 1) * pageCnt15);

			const exec = db.query(countSql+sql, data, function (err, result) {
				if (err) throw err;

				var totalPrice = result[0][0].totalPrice;
				var totalCount = result[0][0].totalCount;
				var refundPrice = result[0][0].refundPrice;
				var refundCount = result[0][0].refundCount;
				var profitPrice = result[0][0].profitPrice;
				var profitCount = result[0][0].profitCount;
				var {startPage, endPage, totalPage} = getPageInfo(currentPage, totalCount, pageCnt15);
				res.status(200).json({status:200, 
									  data: {
									    paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
									    sales: {totalPrice: totalPrice, totalCount: totalCount, refundPrice: refundPrice, refundCount: refundCount, profitPrice: profitPrice, profitCount: profitCount},
									    result: result[1]
									  }, 
									  message:"success"});
			});

			console.log(exec.sql);
		}
);

// 배송정보 조회
api.get('/ship', 
		verifyAdminToken, 
		function (req, res, next) {
			var status = req.query.status;
			var searchType = req.query.searchType;
			var searchWord = req.query.searchWord;
			var startDate = req.query.startDate;
			var endDate = req.query.endDate;

			var countSql = "select count(*) as totalCnt, count(case when shippingStatus = '배송전'  then 1 end ) as befShipCnt,  count(case when shippingStatus = '배송준비중'  then 1 end ) as rdyShipCnt, "
						 + "count(case when shippingStatus = '배송완료'  then 1 end ) as confShipCnt "
						 + "from payment "
						 + "join user on payment.userUID = user.UID "
						 + "where (date_format(payment.regDate, '%Y-%m-%d') between ? and ?) and payment.type = 'product' and payment.orderStatus != '취소요청' and payment.orderStatus != '취소승인' ";
			var sql = "select payment.UID as paymentUID, payment.merchantUid, product.korName, product_option_list.optionName, payment.buyerName, payment.buyerEmail, payment.buyerTel, "
					+ "concat(payment.addr1, ' ', payment.addr2) as addr, payment.regDate, payment.shippingStatus, if(shipResDate = '0000-01-01 00:00:00', '', shipResDate) as shippingDate, "
					+ "if(shipConfDate = '0000-01-01 00:00:00', '', shipConfDate) as shipConfDate "
					+ "from payment "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
					+ "join product on payment_product_list.productUID = product.UID "
					+ "join product_option_list on payment_product_list.optionUID = product_option_list.UID "
					+ "join user on payment.userUID = user.UID "
					+ "where (date_format(payment.regDate, '%Y-%m-%d') between ? and ?) and payment.type = 'product' and payment.orderStatus != '취소요청' and payment.orderStatus != '취소승인' ";
			
			if(status != "all"){
				sql += "and payment.shippingStatus = '" + status + "' ";
				countSql += "and payment.shippingStatus = '" + status + "' ";
			}

			sql += addCellSearchSql(searchType, searchWord, "payment");
			countSql += addCellSearchSql(searchType, searchWord, "payment");

			sql += "group by payment.UID "
				+ "order by payment.regDate desc";

			countSql += ";";

			sql += " limit ?, " + pageCnt15;
			var data = [startDate, endDate, startDate, endDate];
			var currentPage = req.query.page ? parseInt(req.query.page) : 1;
			data.push(parseInt(currentPage - 1) * pageCnt15);

			db.query(countSql+sql, data, function (err, result) {
				if (err) throw err;

				var totalCnt = result[0][0].totalCnt;
				var befShipCnt = result[0][0].befShipCnt;
				var rdyShipCnt = result[0][0].rdyShipCnt;
				var confShipCnt = result[0][0].confShipCnt;
				var {startPage, endPage, totalPage} = getPageInfo(currentPage, totalCnt, pageCnt15);
				res.status(200).json({status:200, 
									  data: {
									    paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
									    status: {totalCnt: totalCnt, befShipCnt: befShipCnt, rdyShipCnt: rdyShipCnt, confShipCnt: confShipCnt},
									    result: result[1]
									  }, 
									  message:"success"});
			});
		}
);

// 배송 스케쥴 조회
api.get('/ship/schedule', 
		verifyAdminToken, 
		function (req, res, next) {
			var startDate = req.query.startDate;
			var endDate = req.query.endDate;
			var sql = "select payment.UID as paymentUID, concat(payment.addr1, ' ', payment.addr2) as addr, payment.shippingStatus, payment.shipResDate as shippingDate, "
					+ "product.korName, product_option_list.optionName "
					+ "from payment "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
					+ "join product on payment_product_list.productUID = product.UID "
					+ "join product_option_list on payment_product_list.optionUID = product_option_list.UID "
					+ "where payment.shippingStatus != '배송전' and (date_format(payment.shipResDate, '%Y-%m-%d') between ? and ?) and payment.type='product'"

			db.query(sql, [startDate, endDate], function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: result, message:"success"});
			});
		}
);

// 배송 예약 등록
api.put('/ship/schedule/:paymentUID', 
		verifyAdminToken, 
		function (req, res, next) {
			var paymentUID = req.params.paymentUID;
			var shipResDate = req.body.date;
			var shipResMsg = req.body.msg;
			var sql = "update payment "
					+ "set shipResDate = ?, shipResMsg = ?, shippingStatus='배송준비중' "
					+ "where UID = ?";
			var data = [shipResDate, shipResMsg, paymentUID];
			db.query(sql, data, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: "true", message:"success"});
			});
		}
);

// 배송 완료
api.put('/ship/complete/:paymentUID', 
		verifyAdminToken, 
		function (req, res, next) {
			var paymentUID = req.params.paymentUID;
			var shipConfDate = req.body.date;
			var shipConfMsg = req.body.msg;
			var shipRcpnt = req.body.recipient;

			var sql = "update payment "
					+ "set shipConfDate = ?, shipConfMsg = ?, shipRcpnt = ?, shippingStatus='배송완료' "
					+ "where UID = ?";
			var data = [shipConfDate, shipConfMsg, shipRcpnt, paymentUID];
			db.query(sql, data, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: "true", message:"success"});
			});
		}
);

// 총 주문 금액
api.get('/sales_status', 
		verifyAdminToken, 
		function (req, res, next) {
			var todaySql = "select ifnull(sum(amount), 0) as totalToday, count(*) as totalCntToday, ifnull(sum(refundAmount), 0) as refundToday, count(case when refundAmount != 0 then 1 end ) as refundCntToday "
						 + "from payment "
						 + "where date_format(regDate, '%Y-%m-%d') = curdate()";
			var thisMonthSql = "select ifnull(sum(amount), 0) as totalSalesThisMonth, count(*) as totalCountThisMonth, ifnull(sum(refundAmount), 0) as refundPriceThisMonth, count(case when refundAmount != 0 then 1 end ) as refundCountThisMonth "
							 + "from payment "
							 + "where (month(regDate)) = (month(curdate()))";
			var type = req.query.type;
			var data = [];
			if(type.length != 0){
				data = [type, type];
				todaySql += " and payment.type = ?";
				thisMonthSql += " and payment.type = ?";
			}

			todaySql += ";";
			thisMonthSql += ";";

			db.query(todaySql+thisMonthSql, data, function (err, result) {
				if (err) throw err;

				var responseData = Object.assign(result[0][0], result[1][0]); //두 결과 합치기

				res.status(200).json({status:200, data: responseData, message:"success"});	
			});
		}
);

// 미러를 구매한 사용자인지 조회
api.get('/check/:userUID', 
		verifyToken,
        function (req, res, next) {
			var userUID = req.params.userUID;
			var sql = "select payment.UID "
					+ "from payment "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
					+ "where userUID = ? and payment_product_list.productUID = 1 and payment.paymentStatus != 'cancelled'";

			db.query(sql, userUID, function (err, result) {
				if (err) throw err;

				if(result.length > 0)
					res.status(200).json({status:200, data: "true", message:"success"});	
				else
					res.status(200).json({status:200, data: "false", message:"fail"});	
			});
        }
);

// 멤버십을 무료로 구매할 수 있는 사용자인지 조회
api.get('/check/free/:userUID',
		verifyToken,
		function (req, res, next) {
			var userUID = req.params.userUID;
			var sql = "select payment.UID "
					+ "from payment "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
					+ "where userUID = ? and payment.paymentStatus != 'cancelled' and orderStatus = '결제완료' and payment.type = 'product' and payment_product_list.productUID = 1 "
					+ "order by payment.regDate "
					+ "limit 1";
			db.query(sql, userUID, function (err, result) {
				if (err) throw err;

				if(result.length > 0){
					var checkAuthSql = "select UID from membership where userUID = ?";
					db.query(checkAuthSql, userUID, function (err, result) {
						if (err) throw err;
						
						if(result.length == 0)
							res.status(200).json({status:200, data: "true", message:"success"});
						else
							res.status(200).json({status:200, data:"false", message:"fail"});
					});
				}	
				else
					res.status(200).json({status:200, data: "false", message:"fail"});	
			});
		}
);

// 멤버십 구매 내역 조회
api.get('/membership/:userUID', 
		verifyToken,
        function (req, res, next) {
			var userUID = req.params.userUID;
			var sql = "select payment.name, payment.amount, payment.payMethod, payment.regDate, payment_product_list.membershipEndDate "
					+ "from payment "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
					+ "where payment.userUID = ? and payment.type = 'membership' "
					+ "order by payment.regDate desc ";
			var data = [userUID, userUID];
			
			var countSql = sql + ";";

			sql += " limit ?, " + pageCnt10;
			var currentPage = req.query.page ? parseInt(req.query.page) : 1;
			data.push((parseInt(currentPage) - 1) * pageCnt10);

			db.query(countSql+sql, data, function (err, result) {
				if (err) throw err;

				var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt10);
				res.status(200).json({status:200, 
									  data: {
									    paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
									    result: result[1]
									  }, 
									  message:"success"});
			});
        }
);

// 결제한 상품의 정보 조회
api.get('/product/info/:paymentUID', 
		verifyToken,
        function (req, res, next) {
			var paymentUID = req.params.paymentUID;
			var sql = "select product_img_list.imgPath, product.korName, product.engName, product.originPrice, product.discountRate, product.discountPrice, product_option_list.optionName, payment.regDate, payment.merchantUid, "
					+ "payment.amount, payment_product_list.count, payment.orderStatus, payment.shippingStatus "
					+ "from payment "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
					+ "join product on payment_product_list.productUID = product.UID "
					+ "join product_option_list on product.UID = product_option_list.productUID "
					+ "join product_img_list on product.UID = product_img_list.productUID "
					+ "where payment.UID = ? "
					+ "group by payment.UID "
					+ "order by payment.regDate desc, product_img_list.UID ";

			db.query(sql, paymentUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: result, message:"success"});	
			});
        }
);

// 사용자가 구매한 상품들 조회
api.get('/product/:userUID', 
		verifyToken,
        function (req, res, next) {
			var userUID = req.params.userUID;
			var sql = "select payment.UID as paymentUID, product_img_list.imgPath, product.korName, product.engName, product.originPrice, product.discountRate, product.discountPrice, product_option_list.optionName, payment.regDate, payment.merchantUid, "
					+ "payment.amount, payment_product_list.count, payment.orderStatus, payment.shippingStatus "
					+ "from payment "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
					+ "join product on payment_product_list.productUID = product.UID "
					+ "join product_option_list on product.UID = product_option_list.productUID "
					+ "join product_img_list on product.UID = product_img_list.productUID "
					+ "where payment.userUID = ? and payment.type = 'product' "
					+ "group by payment.UID "
					+ "order by payment.regDate desc, product_img_list.UID ";
			
			var data = [userUID, userUID];
			
			var countSql = sql + ";";

			sql += " limit ?, " + pageCnt10;
			var currentPage = req.query.page ? parseInt(req.query.page) : 1;
			data.push((parseInt(currentPage) - 1) * pageCnt10);

			db.query(countSql+sql, data, function (err, result) {
				if (err) throw err;
				console.log(result[0].length);

				var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt10);
				res.status(200).json({status:200, 
									  data: {
									    paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
									    result: result[1]
									  }, 
									  message:"success"});
			});
        }
);

async function scheduleMembership(access_token, customer_uid, laterNum, amount, name, custom_data){
	axios({
		url: "https://api.iamport.kr/subscribe/payments/schedule",
		method: "post",
		headers: { "Authorization": access_token }, 
		data: {
		  customer_uid: customer_uid, // 카드(빌링키)와 1:1로 대응하는 값
		  schedules: [
			{
			  merchant_uid: getNewMerchantUid("3", name), // 새로 생성한 예약용 주문 번호 주문 번호
			  schedule_at: getNextDateTime(laterNum), // 결제 시도 시각 in Unix Time Stamp
			  amount: amount,
			  name: name,
			  custom_data: custom_data
			}
		  ]
		}
	  });
}

async function appendFreeMembership(imp_uid, access_token, customer_uid, name, custom_data){
	delete custom_data.payType;

	var amount = 9900;
	const laterNum = 5;
	
	await scheduleMembership(access_token, customer_uid, laterNum, amount, name, custom_data);
}

async function payForMembership(access_token, customer_uid, name, amount, custom_data){
	// 재결제
	const paymentResult = await axios({
        url: 'https://api.iamport.kr/subscribe/payments/again',
        method: "post",
        headers: { "Authorization": access_token },
        data: {
          customer_uid: customer_uid,
          merchant_uid: getNewMerchantUid("2", name), // 새로 생성한 결제(재결제)용 주문 번호
          amount: amount,
          name: name,
        }
      });

	const { code, message } = paymentResult.data;
	if (code === 0) { // 카드사 통신에 성공(실제 승인 성공 여부는 추가 판단이 필요함)
        if ( paymentResult.data.response.status == "paid" ) { //카드 정상 승인
		  // 새로운 결제 예약
		  const laterNum = 1;
		  scheduleMembership(access_token, customer_uid, laterNum, amount, name, custom_data);
		  
		  return {status: 200, data: "true", message: "결제 승인 성공"};

        } else { 
			console.log(message);
		  return {status: 403, data: "false", message: "승인 결제 실패"}; //카드 승인 실패 (예: 고객 카드 한도초과, 거래정지카드, 잔액부족 등)
        }
      } 
	else {
		return {status: 403, data: "false", message: "카드사 요청 실패"}; // 카드사 요청에 실패 (paymentResult is null)
    }
}

// 정기결제 관해서 이니시스에 결제 요청
api.post("/billings", async (req, res) => {
    try {
      const { customer_uid, merchant_uid, imp_uid } = req.body; 

      // 인증 토큰 발급 받기
      const getToken = await axios({
        url: "https://api.iamport.kr/users/getToken",
        method: "post", // POST method
        headers: { "Content-Type": "application/json" }, 
        data: {
          imp_key: imp_key,
          imp_secret: imp_secret
        }
      });
      const { access_token } = getToken.data.response; 

	  // imp_uid로 아임포트 서버에서 결제 정보 조회
      const getPaymentData = await axios({
        url: `https://api.iamport.kr/payments/${imp_uid}`,
        method: "get", // GET method
        headers: { "Authorization": access_token } 
      });

	  var paymentData = getPaymentData.data.response; // 조회한 결제 정보
	  var custom_data = paymentData.custom_data ? JSON.parse(paymentData.custom_data): '';
	  var name = paymentData.name ? paymentData.name : '';
	  var amount = paymentData.amount ? parseInt(paymentData.amount) : 0;
	  var payType =  custom_data.payType;

	  if(payType == "coupon" && name == "single"){
		  // 앱 출시 이후에는 첫 달만 무료이고 그 이후부터는 정기 구독료 납부해야하므로 이 코드 실행
		  //appendFreeMembership(imp_uid, access_token, customer_uid, name, amount, custom_data);
		  res.status(200).json({status: 200, data: "true", message: "결제 승인 성공"});
	  }
	  else{
		  var result = await payForMembership(access_token, customer_uid, name, amount, custom_data);
		  if(result.status == 200)
			  res.status(200).json(result);
		  else
			  res.status(403).json(result);
	  }
    } catch (e) {
		console.log(e);
      res.status(400).send(e);
    }
});

function refundOrder(amount, merchantUid){
	var sql = "update payment set refundAmount = ?, paymentStatus = 'cancelled', orderStatus = '취소승인' where merchantUid = ?";
	var data = [amount, merchantUid];
	db.query(sql, data, function (err, result){
		if (err) throw err;
	});
}

// 이니시스에 환불 요청
api.post("/refund", async (req, res) => {
    try {
	  console.log("refund 호출");
      const { imp_uid, merchant_uid, reason, cancel_request_amount } = req.body;
	  
      // 인증 토큰 발급 받기
      const getToken = await axios({
        url: "https://api.iamport.kr/users/getToken",
        method: "post", // POST method
        headers: { "Content-Type": "application/json" }, 
        data: {
          imp_key: imp_key,
          imp_secret: imp_secret
        }
      });
      const { access_token } = getToken.data.response; 
	  var cancelableAmount = 100;
	  const getCancelData = await axios({
          url: "https://api.iamport.kr/payments/cancel",
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Authorization": access_token // 아임포트 서버로부터 발급받은 엑세스 토큰
          },
          data: {
            reason, // 가맹점 클라이언트로부터 받은 환불사유
            imp_uid, // imp_uid를 환불 `unique key`로 입력
            amount: cancel_request_amount, // 가맹점 클라이언트로부터 받은 환불금액
            checksum: cancelableAmount // [권장] 환불 가능 금액 입력
          }
        });

		const refundData = getCancelData.data.response;
		var amount = refundData.cancel_amount;
		var merchantUid = refundData.merchant_uid;
		
		refundOrder(amount, merchantUid);
    } catch (e) {
      res.status(400).send(e);
    }
});

// 멤버십 예약 취소
api.post("/membership/unschedule", async (req, res) => {
    try {
	  console.log("membership unschedule 호출");
	  var userUID = req.body.userUID;
      // 인증 토큰 발급 받기
      const getToken = await axios({
        url: "https://api.iamport.kr/users/getToken",
        method: "post", // POST method
        headers: { "Content-Type": "application/json" }, 
        data: {
          imp_key: imp_key,
          imp_secret: imp_secret
        }
      });

	  const { access_token } = getToken.data.response; 

	  var sql = "select customerUid from payment where userUID = ? and type = 'membership' order by regDate desc limit 1";
	  db.query(sql, userUID, async (err, result) => {
		  if (err) throw err;

		  var customer_uid = result[0].customerUid;
		  console.log(customer_uid);

		  // 3개월 내에 예약된 정기결제 조회
		  const getScheduledData = await axios({
			  url: `https://api.iamport.kr/subscribe/payments/schedule/customers/${customer_uid}`,
			  method: "get", // GET method
			  headers: { "Authorization": access_token },
			  params: {
				from: getNextDateTime(0), 
				to: getNextDateTime(3)
			  }
		  }).catch(error => {
			  console.log(error);
		  });

		  const { status } = getScheduledData;
		  if(status == 200){
			  const { list } = getScheduledData.data.response;
			  console.log(list);
			  var merchant_uid = list[0].merchant_uid;
				
			  // 예약된 내역 취소
			  const getCancelData = await axios({
				  url: "https://api.iamport.kr/subscribe/payments/unschedule",
				  method: "post",
				  headers: {
					"Content-Type": "application/json",
					"Authorization": access_token // 아임포트 서버로부터 발급받은 엑세스 토큰
				  },
				  data: {
					customer_uid: customer_uid, // 가맹점 클라이언트로부터 받은 환불사유
					merchant_uid: merchant_uid, // imp_uid를 환불 `unique key`로 입력
				  }
			});
		  }
	  });
    } catch (e) {
      res.status(400).send(e);
    }
});


// 취소정보 조회
api.get('/refund', 
		verifyAdminToken, 
		function (req, res, next) {
			var status = req.query.status;
			var searchType = req.query.searchType;
			var searchWord = req.query.searchWord;
			var startDate = req.query.startDate;
			var endDate = req.query.endDate;

			var countSql = "select count(*) as totalCnt, count(case when orderStatus = '취소요청'  then 1 end ) as refReqCnt,  count(case when orderStatus = '취소승인'  then 1 end ) as refOkCnt, "
						 + "count(case when orderStatus = '취소미승인'  then 1 end ) as refNoCnt "
						 + "from payment "
						 + "join user on payment.userUID = user.UID "
						 + "where payment.orderStatus != '결제완료' and payment.type = 'product' and (date_format(payment.regDate, '%Y-%m-%d') between ? and ?) "
			var sql = "select payment.UID as paymentUID, payment.merchantUid, product.korName, product_option_list.optionName, payment.buyerName, payment.buyerEmail, buyerTel, ifnull(payment.refundMsg, '') as refundMsg, "
					+ "ifnull(payment.refConfMsg, '') as refConfMsg, orderStatus, if(reqDate = '0000-01-01 00:00:00', '', reqDate) as reqDate, if(refConfDate = '0000-01-01 00:00:00', '', refConfDate) as refConfDate "
					+ "from payment "
					+ "join user on payment.userUID = user.UID "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
					+ "join product on payment_product_list.productUID = product.UID "
					+ "join product_option_list on payment_product_list.optionUID = product_option_list.UID "
					+ "where payment.type = 'product' and (date_format(payment.regDate, '%Y-%m-%d') between ? and ?) and payment.orderStatus != '결제완료' ";
					
			if(status != "all"){
				sql += "and payment.orderStatus = '" + status + "' ";
				countSql += "and payment.orderStatus = '" + status + "' ";
			}

			sql += addCellSearchSql(searchType, searchWord, "user");
			countSql += addCellSearchSql(searchType, searchWord, "user");

			sql += "group by payment.UID "
				+ "order by payment.reqDate desc";

			countSql += ";";

			sql += " limit ?, " + pageCnt15;

			var data = [startDate, endDate, startDate, endDate];
			var currentPage = req.query.page ? parseInt(req.query.page) : 1;
			data.push(parseInt(currentPage - 1) * pageCnt15);

			db.query(countSql+sql, data, function (err, result) {
				if (err) throw err;

				var totalCnt = result[0][0].totalCnt;
				var refReqCnt = result[0][0].refReqCnt;
				var refOkCnt = result[0][0].refOkCnt;
				var refNoCnt = result[0][0].refNoCnt;
				var {startPage, endPage, totalPage} = getPageInfo(currentPage, totalCnt, pageCnt15);

				res.status(200).json({status:200, 
									  data: {
									    paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
									    status: {totalCnt: totalCnt, refReqCnt: refReqCnt, refOkCnt: refOkCnt, refNoCnt: refNoCnt},
									    result: result[1]
									  }, 
									  message:"success"});
			});
		}
);

// 취소 처리
api.put('/refund/complete/:paymentUID', 
		verifyAdminToken, 
		function (req, res, next) {
			var paymentUID = req.params.paymentUID;
			var refConfMsg = req.body.refConfMsg;
			var orderStatus = req.body.orderStatus;
			var sql = "update payment "
					+ "set refConfMsg = ?, orderStatus = ?, refConfDate = now() "
					+ "where UID = ?";
			var data = [refConfMsg, orderStatus, paymentUID];

			db.query(sql, data, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: "true", message:"success"});	
			});
		}
);

// 취소 요청
api.put('/refund/:paymentUID', verifyToken, function (req, res) {
	var paymentUID = req.params.paymentUID;
	var refundMsg = req.body.refundMsg;

    var sql = "update payment set refundMsg = ?, orderStatus='취소요청', reqDate = now() where UID = ?";
	var data = [refundMsg, paymentUID];

	db.query(sql, data, function (err, result) {
		if (err) throw err;

		res.status(200).json({status:200, data: "true", message:"success"});	
	});
});

// 총 주문 금액
api.get('/refund_status', 
		verifyAdminToken, 
		function (req, res, next) {
			var todaySql = "SELECT count(case when orderStatus = '취소요청' then 1 end) as reqCountToday, count(case when orderStatus = '취소승인' then 1 end) as approvalToday, count(case when orderStatus = '취소미승인' then 1 end) as disapprovalToday "
						 + "from payment "
						 + "where date_format(regDate, '%Y-%m-%d') = curdate();";
			var thisMonthSql = "SELECT count(case when orderStatus = '취소요청' then 1 end) as reqCountThisMonth, count(case when orderStatus = '취소승인' then 1 end) as approvalThisMonth, count(case when orderStatus = '취소미승인' then 1 end) as disapprovalThisMonth "
						  + "from payment "
						  + "where (month(regDate)) = (month(curdate()));";

			db.query(todaySql+thisMonthSql, function (err, result) {
				if (err) throw err;

				var responseData = Object.assign(result[0][0], result[1][0]); //두 결과 합치기

				res.status(200).json({status:200, data: responseData, message:"success"});	
			});
		}
);

function sendPaymentEmail(email, paymentUID){
	var sql = 'select product_img_list.imgPath, product.korName, product.originPrice, product.discountPrice, payment.merchantUid, payment.amount, product.originShippingFee, product.dcShippingFee '
			+ 'from payment '
			+ 'join payment_product_list on payment.UID = payment_product_list.paymentUID '
			+ 'join product on payment_product_list.productUID = product.UID '
			+ 'join product_option_list on product.UID = product_option_list.productUID '
			+ 'join product_img_list on product.UID = product_img_list.productUID '
			+ 'where payment.UID = ? '
			+ 'group by payment.UID '
			+ 'order by payment.regDate desc, product_img_list.UID';
	db.query(sql, paymentUID, function (err, result) {
		if (err) throw err;
		
		sendPaymentMail(result, email);
	});
}



// 주문에 대한 상품 정보 추가
function saveOrderProduct(paymentUID, productUID, optionUID, count, buyerEmail){
	console.log("saveOrderProduct");
	var productPaymentInsertSql = "insert payment_product_list(paymentUID, productUID, optionUID, count) values (?, ?, ?, 1)";
	var productPaymentInsertData = [paymentUID, productUID, optionUID];

	db.query(productPaymentInsertSql, productPaymentInsertData, function (err, result) {
		if (err) throw err;

		sendPaymentEmail(buyerEmail, paymentUID);
	});
}

// 멤버십 정보 업데이트
function updateMembership(level, laterNum, membershipUID){
	console.log("updateMembership");
	var membershipUpdateSql = "update membership set level = ?, endDate = date_add(now(), interval ? month) where UID = ?";
	var membershipUpdateData = [level, laterNum, membershipUID];

	db.query(membershipUpdateSql, membershipUpdateData, function (err, result) {
		if (err) throw err;
	});
}

// 주문에 대한 멤버십 정보 추가
function insertOrderMembership(paymentUID, membershipUID, laterNum){
	console.log("insertOrderMembership");
	var productPaymentInsertSql = "insert payment_product_list(paymentUID, productUID, membershipEndDate) values (?, ?, date_add(now(), interval ? month))";
	var productPaymentInsertData = [paymentUID, membershipUID, laterNum];

	db.query(productPaymentInsertSql, productPaymentInsertData, function (err, result) {
		if (err) throw err;
	});
}

// 멤버십 정보 추가
function insertMembership(userUID, level, laterNum, paymentUID){
	console.log("insertMembership");
	var membershipInsertSql = "insert membership(userUID, level, endDate, paymentUID) values (?, ?, date_add(now(), interval ? month), ?)";
	var membershipInsertData = [userUID, level, laterNum, paymentUID];

	db.query(membershipInsertSql, membershipInsertData, function (err, insertResult) {
		if (err) throw err;

		membershipUID = insertResult.insertId;

		insertOrderMembership(paymentUID, membershipUID, laterNum);
	});
}

// membership 정보 추가/업데이트
function checkAndInsertMembership(userUID, level, paymentUID, laterNum){
	console.log("checkAndInsertMembership");
	var membershipSelectSql = "select UID from membership where userUID = ?";
	db.query(membershipSelectSql, userUID, function (err, result) {
		if (err) throw err;

		let membershipUID = 0;

		if(result.length != 0){
			membershipUID = result[0].UID;
			laterNum = 1;
			updateMembership(level, laterNum, membershipUID);
			insertOrderMembership(paymentUID, membershipUID, laterNum);
		}
		else {
			insertMembership(userUID, level, laterNum, paymentUID);
		}
	});
}

// 장바구니에서 삭제
function deleteMyBasket(myBasketUID){
	var myBasketUID = parseInt(myBasketUID);
	if(myBasketUID != -1){
		var myBasketDeleteSql = "delete from my_basket where UID = ?";
		db.query(myBasketDeleteSql, myBasketUID, function (err, result) {
			if (err) throw err;
		});
	}
}

// 주문 정보 저장
function saveOrder(paidId, paymentData){
	var customData = paymentData.custom_data ? JSON.parse(paymentData.custom_data) : '';
	var userUID = customData.userUID ? parseInt(customData.userUID) : 0;
	var productUID = customData.productUID ? parseInt(customData.productUID) : 0;
	var optionUID = customData.optionUID ? parseInt(customData.optionUID) : 0;
	var addr1 = customData.addr1 ? customData.addr1 : '';
	var addr2 = customData.addr2 ? customData.addr2 : '';
	var requireMents = customData.requireMents ? customData.requireMents : ''; 
	var type = customData.type ? customData.type : '';
	var amount = parseInt(paymentData.amount);
	var applyNum = paymentData.apply_num ? paymentData.apply_num : '';
	var bankName = paymentData.bank_name ? paymentData.bank_name : '';
	var buyerAddr = paymentData.buyer_addr ? paymentData.buyer_addr : '';
	var buyerEmail = paymentData.buyer_email ? paymentData.buyer_email : '';
	if(buyerEmail.length == 0)
		return false;
	var buyerName = paymentData.buyer_name ? paymentData.buyer_name : '';
	var buyerPostcode = paymentData.buyer_postcode ? paymentData.buyer_postcode : '';
	var buyerTel = paymentData.buyer_tel ? paymentData.buyer_tel : '';
	var cardName = paymentData.card_name ? paymentData.card_name : '';
	var cardNumber = paymentData.card_number ? paymentData.card_number : '';
	var cardQuota = paymentData.card_quota ? paymentData.card_quota : '';
	var currency = paymentData.currency ? paymentData.currency : '';
	var customerUid = paymentData.customer_uid ? paymentData.customer_uid : '';
	var impUid = paymentData.imp_uid ? paymentData.imp_uid : '';
	var merchantUid = paymentData.merchant_uid ? paymentData.merchant_uid : '';
	var name = paymentData.name ? paymentData.name : '';
	var paidAt = paymentData.paid_at ? parseInt(paymentData.paid_at) : 0;
	var payMethod = paymentData.pay_method ? paymentData.pay_method : '';
	var pgTid = paymentData.pg_tid ? paymentData.pg_tid : '';
	var pgType = paymentData.pg_type ? paymentData.pg_type : '';
	var receiptUrl = paymentData.receipt_url ? paymentData.receipt_url : '';
	var payType = customData.payType ? customData.payType : '';
	var laterNum = 1; // 만료날짜 한달 후
	var status = paymentData.status ? paymentData.status : '';

	if(payType == "coupon"){
		payMethod = "[미러구매 혜택] 무료 멤버십";
		laterNum = 1; // 만료날짜 1달 후
		delete customData.payType;
	}

	if(payMethod == "card")
		payMethod = "신용카드";


	// 결제 정보 저장
	var paymentInsertSql = "insert payment(userUID, amount, addr1, addr2, requireMents, applyNum, bankName, buyerAddr, buyerEmail, buyerName, buyerPostcode, buyerTel, cardName, cardNumber, cardQuota, currency, customerUid, impUid, "
						+ "merchantUid, name, paidAt, payMethod, pgTid, pgType, receiptUrl, paymentStatus, type) "
						+ "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
	var paymentInsertData = [userUID, amount, addr1, addr2, requireMents, applyNum, bankName, buyerAddr, buyerEmail, buyerName, buyerPostcode, buyerTel, cardName, cardNumber, cardQuota, currency, customerUid, impUid, merchantUid, name,
							 paidAt, payMethod, pgTid, pgType, receiptUrl, status, type];

	var paymentUID = 0;
	db.query(paymentInsertSql, paymentInsertData, function (err, result) {
		if (err) throw err;
		console.log(result);
		
		paymentUID = result.insertId;
		
		if(paidId == "1"){ // product
			// 장바구니에서 삭제
			// deleteMyBasket(customData.myBasketUID);
			var count = 1;
			saveOrderProduct(paymentUID, productUID, optionUID, count, buyerEmail);
		}
		else if(paidId == "2"){ // membership - 처음 결제
			// membership이 없으면 insert, 있으면 만료일 update
			if(payMethod != "[미러구매 혜택] 무료 멤버십")
				sendMembershipEmail(buyerEmail, name, amount, payMethod, cardNumber);
			checkAndInsertMembership(userUID, name, paymentUID, laterNum);
		}
		else if (paidId == "3") { // membership - 정기 결제
			var membershipSql = "select UID, endDate from membership where userUID = ?";
			db.query(membershipSql, userUID, function (err, result) {
				if (err) throw err;		
								
				if(result[0].endDate != undefined){
					var endDate = result[0].endDate;
					endDate = toHypenDateFormat(endDate);
					var currentDateTime = getCurrentDateTime();

					if(endDate >= currentDateTime){							
						// 새로운 결제 예약
						laterNum = 1;
						scheduleMembership(access_token, customer_uid, laterNum, amount, name, custom_data);

						// 만료일을 다음 달로 업데이트
						let membershipUID = result[0].UID;

						updateMembership(name, laterNum, membershipUID);
						insertOrderMembership(paymentUID, membershipUID, laterNum);
					}
				}
			});
		}
	});
}

// 결제 승인, 예약결제가 시도되었을 때의 웹훅(Notification)
api.post("/iamport-webhook", async (req, res) => {
  try {
    const { imp_uid, merchant_uid } = req.body;
	const paidId = merchant_uid.substr(0,1);

    // 액세스 토큰(access token) 발급 받기
    const getToken = await axios({
      url: "https://api.iamport.kr/users/getToken",
      method: "post", // POST method
      headers: { "Content-Type": "application/json" }, 
      data: {
        imp_key: imp_key, 
        imp_secret: imp_secret
      }
    });
    
    const { access_token } = getToken.data.response; 
    
    // imp_uid로 아임포트 서버에서 결제 정보 조회
    const getPaymentData = await axios({
      url: `https://api.iamport.kr/payments/${imp_uid}`,
      method: "get", // GET method
      headers: { "Authorization": access_token } 
    });

    const paymentData = getPaymentData.data.response; // 조회한 결제 정보
    const { status } = paymentData;
	console.log(status);

    if (status === "paid") { // 결제 성공적으로 완료
		saveOrder(paidId, paymentData);		
    } else if (status == "cancelled") {
		refundOrder(amount, merchant_uid);
    }

	res.status(200).send("success");
  } catch (e) {
    res.status(400).send(e);
  }
});

api.get('/:paymentUID', 
		verifyAdminToken, 
		function (req, res, next) {
			var paymentUID = req.params.paymentUID;
			var sql = "select requireMents, if(reqDate = '0000-01-01 00:00:00', '', reqDate) as reqDate, ifnull(refundMsg, '') as refundMsg, buyerName, buyerTel, "
					+ "if(shipResDate = '0000-01-01 00:00:00', '', shipResDate) as shipResDate, shipResMsg, product.korName as productName, product_option_list.optionName "
					+ "from payment "
					+ "join payment_product_list on payment.UID = payment_product_list.paymentUID "
				    + "join product on payment_product_list.productUID = product.UID "
				    + "join product_option_list on payment_product_list.optionUID = product_option_list.UID "
					+ "where payment.UID = ?";
			db.query(sql, paymentUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: result[0], message:"success"});
			});
		}
);

// 주문번호 생성
function getNewMerchantUid(startNo, level){
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

module.exports = api;