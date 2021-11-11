const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {toDotDateFormat} = require('./config/toDateFormat.js');
const {getCurrentDateTime, toHypenDateFormat} = require('./config/date.js');

// 멤버십 소유자인지 조회
api.get('/auth/:userUID', verifyToken, function (req, res) {
        var sql = "select * from membership where userUID = ? order by regDate desc limit 1";
		var data = req.params.userUID;

        db.query(sql, data, function (err, result) {
			if (err) throw err;
			
			if(result.length != 0){
				var endDate = result[0].endDate;
				endDate = toHypenDateFormat(endDate);
				var currentDateTime = getCurrentDateTime();

				if(currentDateTime <= endDate)
					res.status(200).json({status:200,  data: "true", message:"success"});
				else
					res.status(200).json({status:200,  data: "false", message:"fail"});
			}
			else
				res.status(200).json({status:200,  data: "false", message:"fail"});
        });
});

// 멤버십 정보 조회
api.get('/:userUID', verifyToken, function (req, res) {
		var sql = "select level, startDate, endDate from membership where userUID = ? order by endDate";
		var userUID = req.params.userUID;
		db.query(sql, userUID, function (err, result) {
			if (err) throw err;
			
			var maxCount = 0;
			if(result.length != 0) {
				var endDate = result[0].endDate;
				endDate = toHypenDateFormat(endDate);
				var currentDateTime = getCurrentDateTime();

				if(currentDateTime > endDate){
					res.status(200).json({status:200,  data: {level: "normal", startDate: "", endDate: "", maxCount: 0}, message:"success"});
				}
				else{
					switch(result[0].level){
						case "single": 
							maxCount = 1;
							break;
						case "friends":
							maxCount = 3;
							break;
						case "family":
							maxCount = 5;
							break;
					}

					result[0].maxCount = maxCount;
					res.status(200).json({status:200,  data: result[0], message:"success"});
				}
				
			}
			else{
				res.status(200).json({status:200,  data: {level: "normal", startDate: "0000-01-01 00:00:00", endDate: "0000-01-01 00:00:00", maxCount: 0}, message:"success"});
			}
		});
});


module.exports = api;