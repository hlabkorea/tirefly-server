const express = require('express');
const db = require('./config/database.js');
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {sendMail} = require('./config/mail.js');

// 이미 신청한 이메일인지 확인
api.post('/duplicate', 
        [
			check("email", "email is required").not().isEmpty()
        ],
        function (req, res, next) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                var sql = "select UID from preorder where userEmail = ?";
                var data = req.body.email;

                db.query(sql, data, function (err, result) {
                    if (err) throw err;

                    if(result.length == 0)
                        res.status(200).json({status:200, data: "true", message:"success"});
                    else   
                        res.status(403).json({status:403, data: "false", message:"이미 사전예약이 완료된 메일입니다!"});
                });
            }
        }
);

// 사전예약 정보 추가
api.post('/', 
        [
			check("email", "email is required").not().isEmpty(),
            check("region", "region is required").not().isEmpty(),
            check("gender", "gender is required").not().isEmpty(),
            check("age", "age is required").not().isEmpty(),
			check("marketingOpt", "marketingOpt is required").not().isEmpty()
        ],
        function (req, res, next) {
            const errors = getError(req, res);
			var email = req.body.email;
			var region = req.body.region;
			var gender = req.body.gender;
			var age = req.body.age;
			var marketingOpt = req.body.marketingOpt;

			var html = '<div style="text-align: center; color: black;">'
					 + '<br><br>'
					 + '<img src="https://api.motifme.io/files/motif_logo.png"><br>'
					 + '<br>'
					 + '<b style="font-size:18px;"> 혜택 알림 신청 완료! </b><br><br>'
					 + '모티프 미러 프리오더 혜택 알림 신청이 아래와 같이 완료되었습니다.<br>'
				 	 + '정식 프리오더 오픈 시 안내 메일을 전송해드립니다.<br><br>	<br>'
					 + '--------------------------------------------------------------------------------------------------<br><br>'
					 + '<div style="font-size:18px;">'
					 + `신청 이메일 : ${email} <br>`
					 + '<br>'
					 + `배송 희망 지역 : <b> ${region} </b> <br>`
					 + '<br>'
					 + `성별 : <b> ${gender} </b> <br>`
					 + '<br>'
					 + `연령대 : <b> ${age} </b> <br><br>`
					 + '</div>'
					 + '--------------------------------------------------------------------------------------------------'
					 + '</div>';

			var subject = "[모티프 미러 프리오더] 혜택 알림 신청 완료";
			sendMail(email, subject, html);

			if(errors.isEmpty()){
                var sql = "insert into preorder(userEmail, userRegion, userGender, userAge, marketingOpt) values (?, ?, ?, ?, ?)";
                var data = [email, region, gender, age, marketingOpt];

                db.query(sql, data, function (err, result) {
                    if (err) throw err;

                    res.status(200).json({status:200, data: "true", message:"success"});
                });
            }
        }
);

// 사전예약 정보 조회
api.get('/check', 
        function (req, res, next) {
			var sql = "select * from preorder";

			db.query(sql, function (err, result) {
				if (err) throw err;

				res.render("preorder_check", {result: result});
			});
        }
);

module.exports = api;