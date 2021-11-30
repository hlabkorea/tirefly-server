const express = require('express');
const db = require('./config/database.js');
const path = require('path');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

// 버전 체크
api.post('/check', function (req, res) {
	var serial = "m005";
	var qtVer = "1.0.0";
	var userQtVer = req.body.version;
	var userSerial = req.body.serial; 

	// 일련번호 검사
	if(userSerial != serial)
		res.status(403).json({status:403, data:"false", message:"유효하지 않은 일련번호입니다."});

	if(qtVer == userQtVer)
		res.status(200).json({status:200, data: "true", message:"success"});
	else
		res.status(403).json({status:403, data: {fileURL: "https://api.motifme.io/files/motif"}, message:"fail"});
});

module.exports = api;