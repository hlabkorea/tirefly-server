const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const imp_key = "2064037639801337";
const imp_secert = "4ac9b319f5e5943df39f1ac42fd652bb982fe7d250a6d3a03d3150221d08e856aea07ae3f05d07d4";






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

// 멤버십 결제
async function payment(customer_uid, name, amount, custom_data){
    const access_token = await getToken();

    const result = await axios({
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

    return result;
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


module.exports = api;