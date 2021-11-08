const express = require("express"); 
const exec = require("child_process").exec; 
const db = require('./config/database.js');
const path = require('path');
const api = express.Router();
const sSiteCode = "BV365";
const sSitePW = "qkO7uDFG40Wm";
const sModulePath = path.join('/', 'usr', 'share', 'nginx', 'motif-server', 'module', 'CPClient');

var sAuthType = "";      	  //없으면 기본 선택화면, M(휴대폰), X(인증서공통), U(공동인증서), F(금융인증서), S(PASS인증서), C(신용카드)
var sCustomize 	= "";			  //없으면 기본 웹페이지 / Mobile : 모바일페이지
const ip = "http://api.motifme.io:3001/";
var sErrorUrl = ip + "checkplus_fail";	  	// 실패시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)

// 앱 response
api.post("/join", function(req, res) {
    var sEncData = req.body.EncodeData;
    sendResponse('join', res, sEncData);
});

//웹
api.get("/join", function(req, res) {
    if(req.query.EncodeData == undefined){
        var successReturnUrl = ip + "pass/join";	// 성공시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)
        showPassAuth(res, successReturnUrl);
    } else {
        //chrome80 이상 대응
        var sEncData = req.query.EncodeData;
        sendResponse('join', res, sEncData);
    }
});

// 앱 response
api.post("/findId", function(req, res) {
    var sEncData = req.body.EncodeData;
    sendResponse('findId', res, sEncData);
});

//웹
api.get("/findId", function(req, res) {
    if(req.query.EncodeData == undefined){
        var successReturnUrl = ip + "pass/findId"; // 성공시 이동될 URL (방식 : 프로토콜을 포함한 절대 주소)
        showPassAuth(res, successReturnUrl);
    } else {
        //chrome80 이상 대응
        var sEncData = req.query.EncodeData;
        sendResponse('findId', res, sEncData);
    }
});

function showPassAuth(res, successReturnUrl){
    var d = new Date();
    var sCPRequest = sSiteCode + "_" + d.getTime();

    //전달 원문 데이터 초기화
    var sPlaincData = "";
    //전달 암호화 데이터 초기화
    var sEncData = "";
    //처리 결과 메시지
    var sRtnMSG = "";

    sPlaincData = "7:REQ_SEQ" + sCPRequest.length + ":" + sCPRequest +
                    "8:SITECODE" + sSiteCode.length + ":" + sSiteCode +
                    "9:AUTH_TYPE" + sAuthType.length + ":" + sAuthType +
                    "7:RTN_URL" + successReturnUrl.length + ":" + successReturnUrl +
                    "7:ERR_URL" + sErrorUrl.length + ":" + sErrorUrl +
                    "9:CUSTOMIZE" + sCustomize.length + ":" + sCustomize;
        
    var cmd = sModulePath + " " + "ENC" + " " + sSiteCode + " " + sSitePW + " " + sPlaincData;

    var child = exec(cmd , {encoding: "euc-kr"});
    child.stdout.on("data", function(data) {
        sEncData += data;
    });

    console.log(sEncData);

    child.on("close", function() {   
        res.render("checkplus_main", {sEncData, sRtnMSG});
    });
}

function sendResponse(work, res, sEncData){
    console.log("getMobileNo");
    var cmd = "";

    if( /^0-9a-zA-Z+\/=/.test(sEncData) == true){
        sRtnMSG = "입력값 오류";
        requestnumber = "";
        authtype = "";
        errcode = "";
        res.render("checkplus_fail", {sRtnMSG , requestnumber , authtype , errcode});
    }

    if(sEncData != "")
    {
        cmd = sModulePath + " " + "DEC" + " " + sSiteCode + " " + sSitePW + " " + sEncData;
    }

    var sDecData = "";

    var child = exec(cmd , {encoding: "euc-kr"});
    child.stdout.on("data", function(data) {
        sDecData += data;
    });
    child.on("close", function() {
        var mobileno = decodeURIComponent(getValue(sDecData , "MOBILE_NO"));        //휴대폰번호(계약된 경우)
        var sql = "select email from user where cellNumber = ?";

        db.query(sql, mobileno, (err, result, fields) => {
            if(err) throw err;

            if(work == 'findId'){
                if(result.length == 0)
                    res.render("checkplus_success", {status: 403, data: false, message: "가입된 번호가 아닙니다."});
                else   
                    res.render("checkplus_success", {status: 200, data: result[0].email, message: "success"});
            } else if(work == 'join'){
                if(result.length == 0)
                    res.render("checkplus_success", {status: 200, data: mobileno, message: "success"});
                else   
                    res.render("checkplus_success", {status: 403, data: false, message: "이미_가입된_계정이_존재합니다"});
            }
        });
    });
}

function getValue(plaindata , key){
    var arrData = plaindata.split(":");
    var value = "";
    for(i in arrData){
        var item = arrData[i];
        if(item.indexOf(key) == 0)
        {
        var valLen = parseInt(item.replace(key, ""));
        arrData[i++];
        value = arrData[i].substr(0 ,valLen);
        break;
        }
    }
    return value;
}

module.exports = api;
