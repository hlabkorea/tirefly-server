const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {sendMail} = require('./config/mail.js');

// 멤버십 그룹에 추가
api.post('/', 
		 verifyToken, 
		 [
                check("ownerUID", "ownerUID is required").not().isEmpty(),
				check("email", "email is required").not().isEmpty(),
				check("level", "level is required").not().isEmpty()
         ],
		 function (req, res) {
			const errors = getError(req, res);
            if(errors.isEmpty()){
				var ownerUID = req.body.ownerUID;
				var email = req.body.email;
				var level = req.body.level;

				var userUID_sql = "select UID from user where email = ?";
				db.query(userUID_sql, email, function (err, result) {
					if (err) throw err;

					var userUID = 0;
					if(result.length > 0)
						userUID = result[0].UID;

					var count_sql = "select count(*) as count from membership_group where ownerUID = ?";

					if (level == "single" || level == "mobile")
						res.status(403).json({status:403,  data: "false", message:"초대가 불가능합니다."}); // 멘트 수정
					else {
						db.query(count_sql, ownerUID, function (err, result) {
							if (err) throw err;
							
							var isFull = false;
							if (level == "friends"){
								if(result[0].count >= 2) // owner를 제외
									isFull = true;
							} else if (level == "family"){
								if(result[0].count >= 4) // owner를 제외
									isFull = true;
							}		

							if (isFull){
								res.status(403).json({status:403,  data: "false", message:"인원이 초과하여 초대가 불가능합니다."}); // 멘트 수정
							} else { // 이미 초대되어있는 경우
								var checkInvited_sql = "select UID from membership_group where ownerUID = ? and userUID = ?";
								var checkInvited_data = [ownerUID, userUID];

								db.query(checkInvited_sql, checkInvited_data, function (err, result) {
									if (err) throw err;

									if (result.length != 0)
										res.status(403).json({status:403,  data: "false", message:"이미 초대된 계정입니다."});
									else {
										var insert_sql = "insert membership_group(ownerUID, userUID, email) values (?, ?, ?)";
										var insert_data = [ownerUID, userUID, email];

										db.query(insert_sql, insert_data, function (err, result) {
											if (err) throw err;

											var selectOwnerEmail_sql = "select email as ownerEmail from user where UID = ?";
											
											db.query(selectOwnerEmail_sql, ownerUID, function (err, result) {
												if (err) throw err;

												sendInviteEmail(result[0].ownerEmail, email);
											});

											res.status(200).json({status:200,  data: "true", message:"초대 메일이 전송되었습니다."});
										});
									}
								});

							}
						});
					}
				});
				
			}
});

function sendInviteEmail(ownerEmail, userEmail){	
	var html = '<div style="color:#111;font-size:10pt;line-height:1.5;text-align:center"><p><br></p><p><br></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<img src="https://api.motifme.io/files/motif_logo.png"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<b><span style="font-size:13.5pt;line-height:19.26px;color:black">모티퍼 멤버십에 초대되신 것을 축하합니다.</span></b><br><br>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + `<b><span style="font-size:9pt;line-height:12.84px;color:black"> 초대 계정 : ${ownerEmail}</span></b></p>`
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<p><span style="font-size:9pt;line-height:12.84px;color:black">모티프가 제공하는 새로운 방식의 홈트레이닝 서비스를 시작하세요!</span></p>'
			 + '<p><span style="font-size:9pt;line-height:12.84px;color:black">지금 모티프 앱을 설치하시고 경험해보세요</span></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;lbackground-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<a href="https://www.apple.com/kr/app-store" target="_blank"><img src="https://api.motifme.io/files/apple_store_logo.png" style="width: 194px; height: 75px;"></a><br>'
			 + '</div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<i><span lang="EN-US" style="font-size:9pt;line-height:12.84px;color:black"></span></i></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">회원가입 시, 본 메일을 수신하신 이메일 계정을 사용해주세요.</span></p>'
			 + '</div>';
	var subject = "[모티프] 모티프 멤버십 초대 안내";
	sendMail(userEmail, subject, html);
	
}

// 멤버십 그룹에서 계정 삭제
api.delete('/:groupUID',
		verifyToken,
		function (req, res, next){
			var groupUID = req.params.groupUID;
			var sql = "delete from membership_group where UID = ?";

			db.query(sql, groupUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200,  data: "true", message:"계정이 삭제되었습니다."});
			});
		}
);

// 소유자의 멤버 리스트 조회
api.get('/members/:ownerUID',
		verifyToken,
		function (req, res, next){
			var ownerUID = req.params.ownerUID;
			var sql = "select UID as groupUID, email from membership_group where ownerUID = ?";
			db.query(sql, ownerUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200,  data: result, message:"success"});
			});
		}
);

// 멤버의 소유자 리스트 조회
api.get('/owners/:userUID',
		verifyToken,
		function (req, res, next){
			var userUID = req.params.userUID;
			var sql = "select user.email, membership.level, membership.startDate, membership.endDate "
					+ "from membership_group "
					+ "join user on membership_group.ownerUID = user.UID "
					+ "join membership on membership_group.ownerUId = membership.userUID "
					+ "where membership_group.userUID = ? "
					+ "group by membership_group.ownerUID "
					+ "order by membership_group.regDate desc";

			db.query(sql, userUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200,  data: result, message:"success"});
			});
		}
);

module.exports = api;