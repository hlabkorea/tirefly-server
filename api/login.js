const express = require('express');
const db = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const api = express.Router();
const sha256 = require('sha256');
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {getCurrentDateTime, toHypenDateFormat} = require('./config/date.js');

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
  
            var sql = "select * from user where email=? and password=?";
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
                  if(result[0].nickName.length > 0)
                    redirect = "contents";

				  var membership_sql = "select membership.level, membership.endDate "
									 + "from membership "
									 + "left join membership_group on membership.UID = membership_group.ownerUID "
									 + "where membership_group.userUID = ? or membership.userUID = ?"
				  var membership_data = [userUID, userUID];

				  db.query(membership_sql, membership_data, function (err, result, fields) {
					if (err) throw err;
  
					var auth = "normal";
					var endDate = 0;
					if(result.length != 0){
						var endDate = result[0].endDate;
						endDate = toHypenDateFormat(endDate);
						var currentDateTime = getCurrentDateTime();

						if(currentDateTime <= endDate){
							auth = result[0].level;
						}
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
