const express = require('express');
const sha256 = require('sha256');
const db = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const fs = require('fs');
const sharp = require('sharp');
const {upload} = require('./config/uploadFile.js');
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {sendMail} = require('./config/mail.js');
const {maskEmail} = require('./config/masking');
const {toHypenDateFormat} = require('./config/date.js');
const {sendAttachedImgMail} = require('./config/mail.js'); // 테스트하고 삭제

// 회원가입
api.post('/join', 
		[
			check("email", "email is required").not().isEmpty(),
			check("password", "password is required").not().isEmpty(),
			check("cellNumber", "cellNumber is required").not().isEmpty()
		],
		function (req, res) {
			const errors = getError(req, res);
			
			if(errors.isEmpty()){
				var sql = "insert into user(email, password, cellNumber) "
						+ "values (?, ?, ?)";
				var email = req.body.email;
				var passwd = sha256(req.body.password);
				var cellNumber = req.body.cellNumber;
				var data = [email, passwd, cellNumber];
			
				db.query(sql, data, function (err, result) {
					if (err) throw err;

					var userUID = result.insertId;

					var token = jwt.sign({
						userUID: userUID,     // 토큰의 내용(payload)
						auth: "standard"  
					},
						secretObj.secret ,    // 비밀 키
					{
						expiresIn: '1440m'    // 유효 시간은 1440분
					});

					sendJoinEmail(email);

					var token_check_sql = "select token from user_log where userUID = ? "
							+ "order by regDate desc "
							+ "limit 1";

					db.query(token_check_sql, userUID, function (err, result, fields) {
						if (err) throw err;

						if(token != result[0]){
							var token_insert_sql = "insert into user_log(userUID, token) values(?, ?)";
							var token_insert_data = [userUID, token];
							db.query(token_insert_sql, token_insert_data, function (err, result) {
								if (err) throw err;

								var membership_sql = "select UID from membership_group where email = ?";
								db.query(membership_sql, email, function (err, result) {
									if (err) throw err;

									if(result.length > 0){
										var update_sql = "update membership_group set userUID = ? where UID = ?";
										var update_data = [userUID, result[0].UID];

										db.query(update_sql, update_data, function (err, result) {
											if (err) throw err;

											res.status(200).json({status:200, data: {UID: userUID, token: token}, message:"success"});
										});
									} else {
										res.status(200).json({status:200, data: {UID: userUID, token: token}, message:"success"});
									}
									
								});
							});
						}
					});
				});
			}
		}
);

function sendJoinEmail(toEmail){	
	var html = '<div style="color:#111;font-size:10pt;line-height:1.5;text-align:center"><p><br></p><p><br></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<img src="https://api.motifme.io/files/motif_logo.png"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<b><span style="font-size:13.5pt;line-height:19.26px;color:black">회원가입이 완료되었습니다.</span></b><br><br>'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">모티퍼가 되신 것을 환영합니다.</span></p>'
			 + '<p><span style="font-size:9pt;line-height:12.84px;color:black">모티프와 함께 새로운 홈트레이닝 서비스를 경험해보세요!</span></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;lbackground-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<a href="https://www.motifme.io" style="background-color: black; color: white; font-size: 20px; text-align: center; text-decoration: none; border-radius: 10px; width: 252px; height: 59px; padding: 15px 45px"> 모티프 홈페이지로 </a>'
			 + '</div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">회원님의 정보는 철저한 보안 아래 안전하게 유지됩니다.</span></p>'
			 + '</div>';
	var subject = "[모티프] 회원가입 완료 안내";
	sendMail(toEmail, subject, html);	
}

// 이메일 중복 체크
api.post('/overlapEmail',
		[
			check("email", "email is required").not().isEmpty()
		],
		function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var sql = "select count(email) as cnt from user where email = ?";
				var data = req.body.email;
				console.log(req.body.email);
				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					if(result[0].cnt > 0){
						res.status(403).json({status:403, data: "false", message:"이미 등록된 이메일주소 입니다."});
					}else{
						res.status(200).json({status:200, data: "true", message:"사용 가능한 이메일 입니다."});
					}
				});
			}
		}
);

// 이메일 존재 확인
api.post('/existEmail',
			[
							check("email", "email is required").not().isEmpty()
						],
			function (req, res) {
							const errors = getError(req, res);
							if(errors.isEmpty()){
												var sql = "select count(email) as cnt from user where email = ?";
												var data = req.body.email;
												console.log(req.body.email);
												db.query(sql, data, function (err, result, fields) {
																		if (err) throw err;

																		if(result[0].cnt > 0){
																									res.status(200).json({status:200, data: "true", message:"success"});
																								}else{
																															res.status(403).json({status:403, data: "false", message:"가입된 계정이 아니에요!"});
																														}
																	});
											}
						}
);

// 닉네임 중복 체크
api.post('/overlapNick', 
		[
			check("nickName", "nickName is required").not().isEmpty()
		],
		function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var sql = "select count(email) as cnt from user where nickName = ?";
				var data = req.body.nickName;
				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					if(result[0].cnt > 0){
						res.status(403).json({status:403, data:"false", message:"앗! 이런... 이미 같은 닉네임을 가진 모티퍼가 있네요"});
					}else{
						res.status(200).json({status:200, data:"true", message:"사용 가능한 닉네임 입니다."});
					}
				});
			}
		}
);

// 아이디 찾기
api.post('/findId/simple', 
		[
			check("cellNumber", "cellNumber is required").not().isEmpty()
		],
		function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var sql = "select email from user where cellNumber = ?";
				var data = req.body.cellNumber;
			
				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					if(result.length > 0){
						var email = maskEmail(result[0].email);
						res.status(200).json({status:200, data: email, message: "success"});
					}else{
						res.status(403).json({status:403, data:"false", message: "가입된 번호가 아닙니다."});
					}
				});
			}
		}
);

// 비밀번호 변경
api.put('/password', 
		[
			check("email", "email is required").not().isEmpty(),
			check("password", "password is required").not().isEmpty()
		],
		function (req, res){
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var sql = "update user set password = ? where email = ?";
				var data = [sha256(req.body.password), req.body.email];

				db.query(sql, data, function (err, updateResult, fields) {
					if (err) throw err;

					var selectSql = "select user_log.token "
								  + "from user_log "
								  + "join user on user_log.userUID = user.UID "
								  + "where email = ? "
								  + "order by user_log.regDate desc";

					db.query(selectSql, req.body.email, function (err, selectResult, fields){
						if (err) throw err;

						res.status(200).json({status:200, data:"true", message: "비밀번호가 변경되었습니다."});

						var deleteSql = "delete from user_log where token = ?";
						
						db.query(deleteSql, selectResult[0].token, function (err, deleteResult, fields){
							if (err) throw err;
						});		
					});
				});
			}
		}
);

// 비밀번호 찾기
api.post('/findPw', 
		[
			check("email", "email is required").not().isEmpty()
		],
		function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var toEmail = req.body.email;

				var key = randomString();
				var sql = "insert into pwd_auth(email, authKey) values (?, ?)";
				
				var data = [toEmail, key];
				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					if(req.body.type == "web"){
						res.status(200).json({status:200, data:key, message: "success"});
					} else {
						var html = '<div style="color:#111;font-size:10pt;line-height:1.5"><p><br></p><p><br></p>'
								 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
								 + '<img src="https://api.motifme.io/files/motif_logo.png"><br></div>'
								 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
								 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
								 + '<b><span style="font-size:13.5pt;line-height:19.26px;color:black">비밀번호 재설정</span></b><br><br>'
								 + '<span style="font-size:9pt;line-height:12.84px;color:black">아래 버튼을 클릭하시면 비밀번호를 재설정 할 수 있습니다<span lang="EN-US">.</span></span></p>'
								 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;lbackground-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
								 + '<span lang="EN-US" style="font-size:9pt;line-height:12.84px;color:black"> </span></p>'
								 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
								 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
								 + `<a href="http://43.133.64.160/user/new_pw.html?auth=${key}" style="background-color: black; color: white; font-size: 20px; text-align: center; text-decoration: none; border-radius: 10px; width: 252px; height: 59px; padding: 15px 45px"> 비밀번호 재설정 </a>`
								 + '</div>'
								 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
								 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
								 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
								 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
								 + '<span style="font-size:9pt;line-height:12.84px;color:black">해당 링크는<span> </span><span lang="EN-US">24</span>시간 동안 유효합니다<span lang="EN-US">.</span></span></p>'
								 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
								 + '<span style="font-size:9pt;line-height:12.84px;color:black">새로운 비밀번호 설정을 원하지 않는 경우에는 해당 메일은 무시하시면 됩니다</span></p></div>';

						var subject = "[모티프] 비밀번호 재설정 안내";
						sendMail(toEmail, subject, html);
						res.status(200).json({status:200, data:"true", message: "비밀번호 재설정 메일이 전송되었습니다."});
					}
				});
			}
		}
);

// 운동목적
api.put('/purpose/:userUID',
		verifyToken, 
		[
			check("purpose", "purpose is required").not().isEmpty()
		],
		function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var sql = "update user set purpose = ? where UID = ?";
				var data = [req.body.purpose, req.params.userUID];

				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					res.status(200).json({status:200, data: "true", message:"success"});
				});
			}
		}
);

// 프로필 이미지 변경 
api.put('/image/:userUID', 
		verifyToken,
		upload.single("profileImg"), 
		function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try{
					sharp(req.file.path)
						.resize({width: 300, height: 300})
						.withMetadata()
						.toBuffer((err, buffer) => {
							if(err) throw err;

							fs.writeFile(req.file.path, buffer, (err) => {
								if(err) throw err;
							});
						});
				} catch(err){
					throw err;
				}
				var sql = "update user set profileImg = ? where UID = ?";
				var data = [req.file.filename, req.params.userUID];
				console.log(data);
				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					res.status(200).json({status:200, data:"true", message: "success"});
				});
			}
		}
);

// 프로필 조회
api.get('/:userUID', verifyToken, function (req, res) {
	var responseData = {};

	var info_sql = "select profileImg, email, cellNumber, nickName, birthday, gender, height, weight, purpose, intensity, frequency, theHours, momentum "
				+ "from user "
				+ "where UID = ?";
	db.query(info_sql, req.params.userUID, function (err, result, fields) {
		if (err) throw err;

		if(result.length != 0){
			if(result[0].birthday != null){
				result[0].birthday = toHypenDateFormat(result[0].birthday);
			}
			responseData = result[0];
		}
	});

	var category_sql = "select category.UID as UID, category.categoryName "
					+ "from my_category "
					+ "join category on my_category.categoryUID = category.UID "
					+ "where my_category.userUID = ?";
	db.query(category_sql, req.params.userUID, function (err, result, fields) {
		if (err) throw err;

		responseData.categories = [];
		if(result.length != 0)
			responseData.categories = result;
	});

	var acc_sql = "select acc.UID as accUID, accName, acc.imgPath "
				+ "from my_acc "
				+ "join acc on my_acc.accUID = acc.UID "
				+ "where my_acc.userUID = ?";
	db.query(acc_sql, req.params.userUID, function (err, result, fields) {
		if (err) throw err;

		responseData.accs = [];
		
		if(result.length != 0)
			responseData.accs = result;
			
		res.status(200).json({status:200, data: responseData, message:"success"});
	});
});

// 프로필 변경
api.put('/:userUID', 
		verifyToken,
		[
			check("nickName", "nickName is required").not().isEmpty(),
			check("birthday", "birthday is required").not().isEmpty(),
			check("gender", "gender is required").not().isEmpty(),
			check("height", "height is required").not().isEmpty(),
			check("weight", "weight is required").not().isEmpty(),
			check("intensity", "intensity is required").not().isEmpty(),
			check("frequency", "frequency is required").not().isEmpty(),
			check("momentum", "momentum is required").not().isEmpty(),
			check("theHours", "theHours is required").not().isEmpty()
		], 
		function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var sql = "update user "
						+ "set nickName = ?, birthday = ?, gender = ?, height = ?, weight = ?, intensity = ?, frequency = ?, theHours = ?, momentum = ? where UID = ?";	
				var data = [req.body.nickName, req.body.birthday, req.body.gender, req.body.height, req.body.weight, req.body.intensity, req.body.frequency, req.body.theHours, 
							req.body.momentum, req.params.userUID];

				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					res.status(200).json({status:200, data:"true", message: "success"});
				});	
			}
		}
);

function randomString() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    const stringLength = 8;
    var randomstring = '';
    for (var i = 0; i < stringLength; i++) {
      const rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
}

module.exports = api;
