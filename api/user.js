const express = require('express');
const sha256 = require('sha256');
const { con } = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const fs = require('fs');
const sharp = require('sharp');
const { upload } = require('./config/uploadFile.js');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { sendJoinMail, sendPasswdMail } = require('./config/mail.js');
const { maskEmail } = require('./config/masking');
const { addSearchSql } = require('./config/searchSql.js');
const { getPageInfo } = require('./config/paging.js'); 
const pageCnt15 = 15;

// 회원 조회
api.get('/', verifyAdminToken, async function (req, res) {
	try{
		var sql = "select UID as userUID, email, nickName, cellNumber, gender, birthday, status from user where UID >= 1 ";
		const searchType = req.query.searchType ? req.query.searchType : '';
		const searchWord = req.query.searchWord ? req.query.searchWord : '';
		sql += addSearchSql(searchType, searchWord);
		
		sql += "order by regDate desc, UID desc ";
		
		var countSql = sql + ";";

		sql += "limit ?, " + pageCnt15;
		const currentPage = req.query.page ? parseInt(req.query.page) : 1;
		const sqlData = parseInt(currentPage - 1) * pageCnt15;
		const [result] = await con.query(countSql+sql, sqlData);
        const {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt15);

		res.status(200).json({status:200, 
							  data: {
								paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
								result: result[1]
							  }, 
							  message:"success"});
    } catch (err) {
        throw err;
    }
});

// 프로필 조회
api.get('/:userUID', verifyToken, async function (req, res) {
	try{
		var responseData = {};
		const userUID = req.params.userUID;

		// 사용자 정보 조회
		responseData = await selectUserInfo(userUID);
		responseData.categories = await selectUserCategory(userUID);
		responseData.accs = await selectUserAcc(userUID);

		res.status(200).json({status:200, data: responseData, message:"success"});
	} catch (err) {
		throw err;
	}
});

// 회원가입
api.post('/join', 
		[
			check("email", "email is required").not().isEmpty(),
			check("password", "password is required").not().isEmpty(),
			check("cellNumber", "cellNumber is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			
			if(errors.isEmpty()){
				try {
					const email = req.body.email;
					const password = sha256(req.body.password);
					const cellNumber = req.body.cellNumber;
					const userUID = await insertUser(email, password, cellNumber);
					const memUIDs = await selectGroupUIDs(email);

					var auth = "normal";
					if(memUIDs.length > 0){
						auth = "invited";
						var updateUIDs = [];
						for(var i in memUIDs)
							updateUIDs.push(memUIDs[i].UID);
							await updateGroupUserUID(userUID, updateUIDs);
					}

					const token = makeJWT(userUID, auth);
					insertToken(userUID, token);
					sendJoinMail(email);

					res.status(200).json({status:200, data: {UID: userUID, email: email, token: token, auth: auth}, message:"success"});
				} catch (err) {
					console.log(err);
					throw err;
				}
			}
		}
);

// 이메일 중복 체크
api.post('/overlapEmail',
		[
			check("email", "email is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try {
					const email = req.body.email;
					var sql = "select status from user where email = ?";
					const [result] = await con.query(sql, email);

					if(result.length > 0)
						res.status(403).json({status:403, data: "false", message:"이미 등록된 이메일주소 입니다."});
					else
						res.status(200).json({status:200, data: "true", message:"사용 가능한 이메일 입니다."});
				} catch (err) {
					throw err;
				}
			}
		}
); 

// 이메일 존재 확인
api.post('/existEmail',
		[
			check("email", "email is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try{
					var sql = "select count(email) as cnt from user where email = ? and status != 'delete'";
					const email = req.body.email;
					const [result] = await con.query(sql, email);

					if(result[0].cnt > 0)
						res.status(200).json({status:200, data: "true", message:"success"});
					else
						res.status(403).json({status:403, data: "false", message:"가입된 계정이 아니에요!"});
				} catch (err) {
					throw err;
				}
			}
		}
);

// 닉네임 중복 체크
api.post('/overlapNick', 
		[
			check("nickName", "nickName is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try{
					var sql = "select count(email) as cnt from user where nickName = ?";
					const nickName = req.body.nickName;
					const [result] = await con.query(sql, nickName);

					if(result[0].cnt > 0){
						res.status(403).json({status:403, data:"false", message:"앗! 이런... 이미 같은 닉네임을 가진 모티퍼가 있네요"});
					} else{
						res.status(200).json({status:200, data:"true", message:"사용 가능한 닉네임 입니다."});
					}
				} catch (err) {
					throw err;
				}
			}
		}
);

// 아이디 찾기 - 간편 찾기
api.post('/findId/simple', 
		[
			check("cellNumber", "cellNumber is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try{
					var sql = "select email from user where cellNumber = ?";
					const cellNumber = req.body.cellNumber;
					const [result] = await con.query(sql, cellNumber);

					if(result.length > 0){
						const email = maskEmail(result[0].email);
						res.status(200).json({status:200, data: email, message: "success"});
					} else{
						res.status(403).json({status:403, data:"false", message: "가입된 번호가 아닙니다."});
					}
				} catch (err) {
					throw err;
				}
			}
		}
);

// 비밀번호 찾기
api.post('/findPw', 
		[
			check("email", "email is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try{
					const email = req.body.email;
					const key = randomString();
					
					var sql = "insert into pwd_auth(email, authKey) values (?, ?)";
					const sqlData = [email, key];
					await con.query(sql, sqlData);

					sendPasswdMail(email, key);
					res.status(200).json({status:200, data:"true", message: "비밀번호 재설정 메일이 전송되었습니다."});
				} catch (err) {
					throw err;
				}
			}
		}
);

// 비밀번호 토큰 발급
api.post('/pwd_token', 
        verifyToken,
		[
			check("email", "email is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try{
					const email = req.body.email;
					const password = sha256(req.body.password);

					if(!await isEqualPasswd(email, password)){
						res.status(403).json({status:403, data:"false", message: "비밀번호가 일치하지 않아요!"});
						return false;
					}

					const authKey = randomString();
					await insertPwdToken(email, authKey);

					res.status(200).json({status:200, data:{authKey: key}, message: "success"});
				} catch (err) {
					throw err;
				}
			}
		}
);

// 비밀번호 변경
api.put('/password', 
		[
			check("email", "email is required").not().isEmpty(),
			check("password", "password is required").not().isEmpty()
		],
		async function (req, res){
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try{
					const email = req.body.email;
					const password = sha256(req.body.password);

					await updatePasswd(email, password);
					const pwdToken = await selectToken(email);
					await deleteToken(pwdToken);

					res.status(200).json({status:200, data:"true", message: "비밀번호가 변경되었습니다."});
				} catch (err) {
					throw err;
				}
			}
		}
);

// 운동목적 추가/변경
api.put('/purpose/:userUID',
		verifyToken, 
		[
			check("purpose", "purpose is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				const purpose = req.body.purpose;
				const userUID = req.params.userUID;

				var sql = "update user set purpose = ? where UID = ?";
				var sqlData = [purpose, userUID];
				await con.query(sql, sqlData);

				res.status(200).json({status:200, data: "true", message:"success"});
			}
		}
);

// 프로필 이미지 변경 
api.put('/image/:userUID', 
		verifyToken,
		upload.single("profileImg"), 
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				try{
					const filename = req.file.filename;
					const userUID = req.params.userUID;

					// 이미지 300*300 자르기
					sharp(req.file.path)
						.resize({width: 300, height: 300})
						.withMetadata()
						.toBuffer((err, buffer) => {
							if(err) throw err;

							fs.writeFile(req.file.path, buffer, (err) => {
								if(err) throw err;
							});
						});

					var sql = "update user set profileImg = ? where UID = ?";
					var sqlData = [filename, userUID];
					await con.query(sql, sqlData);

					res.status(200).json({status:200, data:"true", message: "success"});
				} catch(err){
					throw err;
				}
			}
		}
);

// 프로필 이미지 삭제하여 기본 이미지로 변경
api.put('/basic_image/:userUID', 
		verifyToken,
		async function (req, res) {
			try{
				const userUID = req.params.userUID;
				
				const filename = await selectProfileFile(userUID);
				deleteProfileFile(filename);
				await updateBasicImg(userUID);
				
				res.status(200).json({status:200, data:"true", message: "success"});
			} catch (err) {
				throw err;
			}
		}
);

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
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				const userUID = req.params.userUID;
				const nickName = req.body.nickName;
				const birthday = req.body.birthday;
				const gender = req.body.gender;
				const height = req.body.height;
				const weight = req.body.weight;
				const intensity = req.body.intensity;
				const frequency = req.body.frequency;
				const theHours = req.body.theHours;
				const momentum = req.body.momentum;

				var sql = "update user "
						+ "set nickName = ?, birthday = ?, gender = ?, height = ?, weight = ?, intensity = ?, frequency = ?, theHours = ?, momentum = ? where UID = ?";	
				var sqlData = [nickName, birthday, gender, height, weight, intensity, frequency, theHours, momentum, userUID];
				await con.query(sql, sqlData);

				res.status(200).json({status:200, data:"true", message: "success"});
			}
		}
);

// 회원 탈퇴 처리
api.delete('/:userUID', 
        verifyToken, 
        [
			check("delMsg", "delMsg is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){	
                var userUID = req.params.userUID;
                var delMsg = req.body.delMsg ? req.body.delMsg : ''; 
				var sql = "update user "
                        + "set status = 'delete', email = concat(email, '/', cellNumber), password = '', nickName = '', profileImg = '', birthday = '0000-01-01', gender = '', height = 0, weight = 0, "
                        + "intensity = '', frequency = 0, theHours = '', momentum = '', cellNumber = '', purpose = '', delMsg = ? "
                        + "where UID = ?";
				var sqlData = [delMsg, userUID];
				await con.query(sql, sqlData);

				res.status(200).json({status:200, data:"true", message: "success"});
			}
		}
);

// 로그인에서 동일한 함수 사용
// 사용자 로그인 이력 추가
function insertToken(userUID, token) {
    var sql = "insert into user_log(userUID, token) values(?, ?)";
    const sqlData = [userUID, token];
    con.query(sql, sqlData);
}

// 로그인에서 동일한 함수 사용
// jwt 생성
function makeJWT(userUID, auth) {
    var token = jwt.sign({
            userUID: userUID,
            auth: auth
        },
        secretObj.secret, // 비밀 키
        {
            expiresIn: '30d'
            //expiresIn: '1440m'    // 유효 시간은 1440분
        });

    return token;
}

// 회원 추가
async function insertUser(email, password, cellNumber) {
	var sql = "insert into user(email, password, cellNumber, status) "
				+ "values (?, ?, ?, 'act')";
	const sqlData = [email, password, cellNumber];
	const [rows] = await con.query(sql, sqlData);
	return rows.insertId;
}

// 초대된 멤버십 그룹의 UID
async function selectGroupUIDs(email) {
	var sql = "select UID from membership_group where email = ? and userUID = 0";
	const [result] = await con.query(sql, email);
	return result;
}

// 초대된 멤버십의 userUID 업데이트
async function updateGroupUserUID(userUID, updateUIDs) {
	var sql = "update membership_group set userUID = ? where UID in (?)";
	const sqlData = [userUID, updateUIDs];
	await con.query(sql, sqlData);
}

// 회원 기본 정보 조회
async function selectUserInfo(userUID){
	var sql = "select profileImg, email, cellNumber, nickName, birthday, gender, height, weight, purpose, intensity, frequency, theHours, momentum, regDate "
					+ "from user "
					+ "where UID = ?";

	const [result] = await con.query(sql, userUID);
	return result[0];
}

// 회원 관심 카테고리 조회
async function selectUserCategory(userUID){
	var sql = "select category.UID as UID, category.categoryName "
						+ "from my_category "
						+ "join category on my_category.categoryUID = category.UID "
						+ "where my_category.userUID = ?";
	const [result] = await con.query(sql, userUID);
	return result;
}

// 회원 보유 악세사리 조회
async function selectUserAcc(userUID){
	var sql = "select acc.UID as accUID, accName, acc.imgPath "
					+ "from my_acc "
					+ "join acc on my_acc.accUID = acc.UID "
					+ "where my_acc.userUID = ?";
	const [result] = await con.query(sql, userUID);
	return result;
}

// pwdAuth randomString 생성
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

// 비밀번호 변경
async function updatePasswd(email, password) {
	var sql = "update user set password = ? where email = ?";
	const sqlData = [password, email];
	await con.query(sql, sqlData);
}

// 비밀번호 token 조회
async function selectToken(email) {
	var sql = "select user_log.token " +
		"from user_log " +
		"join user on user_log.userUID = user.UID " +
		"where email = ? " +
		"order by user_log.regDate desc " +
		"limit 1";
	const [result] = await con.query(sql, email);

	return result[0].token;
}

// 원래 존재하던 비밀번호 token 삭제
async function deleteToken(token) {
	var sql = "delete from user_log where token = ?";
	await con.query(sql, token);
}

// 비밀번호 확인
async function isEqualPasswd(email, password){
	var sql = "select UID from user where email = ? and password = ?"
	const sqlData = [email, password];
	const [result] = await con.query(sql, sqlData);
	if(result.length > 0) // 가입된 회원인 경우
		return true;
	else // 가입 정보를 찾을 수 없는 경우
		return false;
}

// 비밀번호 토큰값 추가
async function insertPwdToken(email, authKey){
	var sql = "insert into pwd_auth(email, authKey) values (?, ?)";
	const sqlData = [email, authKey];
	await con.query(sql, sqlData);
}

// 프
async function selectProfileFile(userUID){
	var sql = "select profileImg from user where UID = ?";
	const [result] = await con.query(sql, userUID);
	return result[0].profileImg;
}

// 프로필 이미지 파일 삭제
async function deleteProfileFile(filename){
	const filePath = '../motif-server/views/files/';

	// 파일이 존재하면 삭제
	fs.exists(filePath + filename, function (exists) {
		if(exists){							
			fs.unlink(filePath + filename, function (err) {
				if (err) throw err;
			});
		}
	});
}

// 회원 프로필 이미지 
async function updateBasicImg(userUID){
	var sql = "update user set profileImg = '' where UID = ?";
	await con.query(sql, userUID);
}

module.exports = api;
