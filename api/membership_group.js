const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {sendInviteEmail} = require('./config/mail.js');

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
								var checkInvited_sql = "select UID from membership_group where ownerUID = ? and email = ?";
								var checkInvited_data = [ownerUID, email];

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
			var sql = "select UID as groupUID, email from membership_group where ownerUID = ? order by email";
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
					+ "join membership on membership_group.ownerUID = membership.userUID "
					+ "where membership_group.userUID = ? and date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d')"
					+ "group by membership_group.ownerUID "
					+ "order by membership_group.email";

			db.query(sql, userUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200,  data: result, message:"success"});
			});
		}
);

module.exports = api;