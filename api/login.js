const express = require('express');
const db = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const api = express.Router();
const sha256 = require('sha256');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 로그인
api.post('/', 
        [
          check("email", "email is required").not().isEmpty(),
          check("password", "password is required").not().isEmpty()
        ],
        function (req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
            var email= req.body.email;
            var password= req.body.password;
  
			// 아이디 비밀번호 확인
            var sql = "select * from user where email=? and password=? and status != 'deleted'";
            var data = [email, sha256(password)];
            var userUID = 0;
            var token = '';
            
            db.query(sql, data, function (err, result) {
              if (err) throw err;
  
                if(!result[0]){
                  res.status(403).send({status: 403, data: [], message: "비밀번호가 맞지 않아요!"});
                } else{
                  userUID = result[0].UID;
                  var redirect = "setting";

                  if(result[0].status == "sleep")
                    redirect = "sleep";
                  else if(result[0].nickName.length > 0)
                    redirect = "contents";
				  
				  var membership_sql = "select level, endDate from membership "
									 + "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and userUID = ?";

				  db.query(membership_sql, userUID, function (err, result, fields) {
					if (err) throw err;
  
					var auth = "normal";
					var endDate = 0;

					// 멤버십 결제자인지 확인
					if (result.length != 0){
						auth = result[0].level;
						endDate = result[0].endDate;
						token = jwt.sign({
						  userUID: userUID,
						  auth: auth
						},
						secretObj.secret ,    // 비밀 키
						{
							expiresIn: '30d'
						  //expiresIn: '1440m'    // 유효 시간은 1440분
						});

						res.status(200).send({status: 200, data: {UID: userUID ,token: token, redirect: redirect, auth: auth, endDate: endDate}});
					}
					else { // Invited 유저인지 확인
						var membership_group_sql = "select membership.endDate "
												 + "from membership_group "
												 + "join membership on membership.userUID = membership_group.ownerUID "
												 + "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and membership_group.userUID = ? "
												 + "order by membership.endDate desc "
												 + "limit 1";
						 db.query(membership_group_sql, userUID, function (err, result, fields) {
							if (err) throw err;
							
							if (result.length != 0){
								auth = "invited";
								endDate = result[0].endDate;
							}
							token = jwt.sign({
							  userUID: userUID,
							  auth: auth
							},
							secretObj.secret ,    // 비밀 키
							{
								expiresIn: '30d'
							  //expiresIn: '1440m'    // 유효 시간은 1440분
							});

							res.status(200).send({status: 200, data: {UID: userUID ,token: token, redirect: redirect, auth: auth, endDate: endDate}});

						 });
					}
					
				  });
  
				  // 토큰 이력 추가
                  var token_check_sql = "select token from user_log where userUID = ? "
                                + "order by regDate desc "
                                + "limit 1";
  
                  db.query(token_check_sql, userUID, function (err, result, fields) {
                    if (err) throw err;
  
                    if(token != result[0]){
                      var token_insert_sql = "insert into user_log(userUID, token) values(?, ?)";
                      var data = [userUID, token];
                      db.query(token_insert_sql, data, function (err, result, fields) {
                        if (err) throw err;
                      });
                    }
                  });
                }
            });
          }
        }
);

module.exports = api;
