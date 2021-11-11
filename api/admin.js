const express = require('express');
const sha256 = require('sha256');
const db = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

// 관리자 계정 회원가입
api.post('/join',
		function (req, res) {
			var sql = "insert into admin(email, password, name, department) "
					+ "values (?, ?, ?, ?)";
			var email = req.body.email;
			var passwd = sha256(req.body.password);
			var name = req.body.name;
			var department = req.body.department;
			var data = [email, passwd, name, department];
		
			db.query(sql, data, function (err, result) {
				if (err) throw err;

				var userUID = result.insertId;

				var token = jwt.sign({
					userUID: userUID,     // 토큰의 내용(payload)
				},
					secretObj.secret ,    // 비밀 키
				{
					expiresIn: '1440m'    // 유효 시간은 1440분
				});
				
				// 토큰 이력 추가
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
						});
					}
				});

				res.status(200).json({status:200, data: {UID: userUID, token: token}, message:"success"});
			});
		}
);

module.exports = api;