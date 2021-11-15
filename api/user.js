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
const {sendJoinMail, sendPasswdMail} = require('./config/mail.js');
const {maskEmail} = require('./config/masking');
const {toHypenDateFormat} = require('./config/date.js');

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

					sendJoinMail(email);
					
					// 토큰 이력 추가
					var token_insert_sql = "insert into user_log(userUID, token) values(?, ?)";
					var token_insert_data = [userUID, token];
					db.query(token_insert_sql, token_insert_data, function (err, result) {
						if (err) throw err;

						// 멤버십 그룹에 초대된 사용자라면 membership_group 의 userUID 업데이트
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
				});
			}
		}
);

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
				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					if(result[0].cnt > 0)
						res.status(200).json({status:200, data: "true", message:"success"});
					else
						res.status(403).json({status:403, data: "false", message:"가입된 계정이 아니에요!"});
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

					// 원래의 token 무효화
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
						sendPasswdMail(toEmail);
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

				var filename = req.file.filename;
				var userUID = req.params.userUID;
				var sql = "update user set profileImg = ? where UID = ?";
				var data = [filename, userUID];
				console.log(data);
				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					res.status(200).json({status:200, data:"true", message: "success"});
				});
			}
		}
);

// 프로필 이미지 삭제하여 기본 이미지로 변경
api.put('/basic_img/:userUID', 
		verifyToken,
		function (req, res) {
			var userUID = req.params.userUID;
			
			var sql = "select profileImg from user where UID = ?";
			db.query(sql, userUID, function (err, result, fields) {
				if (err) throw err;
				var filename = result[0].profileImg;
				try{
					var filePath = '../motif-server/views/files/';
					// 파일이 존재하면 삭제
					fs.exists(filePath + filename, function (exists) {
						if(exists){							
							fs.unlink(filePath + filename, function (err) {
								if (err) throw err;
							});
						}
					});
					var sql = "update user set profileImg = '' where UID = ?";
					db.query(sql, userUID, function (err, result, fields) {
						if (err) throw err;
					});
					res.status(200).json({status:200, data:"true", message: "success"});
				} catch(err){
					throw err;
				}

			});
		}
);

// 프로필 조회
api.get('/:userUID', verifyToken, async function (req, res) {
	var responseData = {};
	var userUID = req.params.userUID;

	// 사용자 정보 조회
	var info_sql = "select profileImg, email, cellNumber, nickName, birthday, gender, height, weight, purpose, intensity, frequency, theHours, momentum "
				+ "from user "
				+ "where UID = ?";
	await db.query(info_sql, userUID, function (err, result, fields) {
		if (err) throw err;

		if(result.length != 0){
			if(result[0].birthday != null){
				result[0].birthday = toHypenDateFormat(result[0].birthday);
			}
			responseData = result[0];
		}
	});

	// 관심운동 조회
	var category_sql = "select category.UID as UID, category.categoryName "
					+ "from my_category "
					+ "join category on my_category.categoryUID = category.UID "
					+ "where my_category.userUID = ?";
	await db.query(category_sql, userUID, function (err, result, fields) {
		if (err) throw err;

		responseData.categories = [];
		if(result.length != 0)
			responseData.categories = result;
	});

	// 보유장비 조회
	var acc_sql = "select acc.UID as accUID, accName, acc.imgPath "
				+ "from my_acc "
				+ "join acc on my_acc.accUID = acc.UID "
				+ "where my_acc.userUID = ?";
	db.query(acc_sql, userUID, function (err, result, fields) {
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
