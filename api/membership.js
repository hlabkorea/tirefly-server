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
        /*var sql = "select membership_group.ownerUID, membership_group.userUID, membership_group.UID, membership_group.email, membership.level, membership.startDate, membership.endDate "
				+ "from membership "
				+ "left join membership_group on membership_group.ownerUID = membership.userUID "
				+ "join user on membership.userUID = user.UID "
				+ "where membership_group.userUID = ? or membership.userUID = ?";
		var data = [parseInt(req.params.userUID), parseInt(req.params.userUID)];

        const execSql = db.query(sql, data, function (err, result) {
			if (err) throw err;

			if (result.length != 0) {
				if (result[0].startDate != null)
					result[0].startDate = toDotDateFormat(result[0].startDate);
				if (result[0].endDate != null)
					result[0].endDate = toDotDateFormat(result[0].endDate);

				var responseData = {};
				responseData.level = result[0].level;
				responseData.startDate = result[0].startDate;
				responseData.endDate = result[0].endDate;

				var maxCount = 0;
				var level = result[0].level;

				switch(level){
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

				responseData.maxCount = maxCount;

				var member = [];

				for(var i in result){
					var memberInfo = {};
					var ownerUID = result[i].ownerUID;
					var userUID = result[i].userUID;
					memberInfo.UID = result[i].UID;
					memberInfo.email = result[i].email;
					console.log(i);
					console.log(result[i].email);
					if(ownerUID == userUID)
						memberInfo.isOwner = true;
					else
						memberInfo.isOwner = false;
					member.push(memberInfo);
				}

				responseData.memberList = member;

				res.status(200).json({status:200,  data: responseData, message:"success"});
			} else {
				res.status(403).json({status:403,  data: "false", message:"멤버십 가입하기"});
			}
        });*/

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