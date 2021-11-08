const express = require('express');
const db = require('./config/database.js');
const api = express.Router();

// 인증키에 맞는 email 조회
api.post('/email', function (req, res) {
    var getEmailsql = "SELECT email, NOW() as now, DATE_ADD(regDate, INTERVAL 1 DAY) as endDate FROM pwd_auth WHERE authKey = ?";
    var clientKey = req.body.authKey;
	console.log(clientKey);

    db.query(getEmailsql, clientKey, function (err, result) {
        if (err) throw err;
        
        if(result.length != 0){
			console.log(result[0].now);
			console.log(result[0].endDate);
			if(result[0].now > result[0].endDate)
				res.status(403).json({status:403, data:"false", message:"비밀번호 변경에 대한 권한이 없는 계정입니다."}); // 유효시간 만료
			else
				res.status(200).json({status:200, data:result[0].email, message:"success"});
		}
        else    
            res.status(403).json({status:403, data:"false", message:"비밀번호 변경에 대한 권한이 없는 계정입니다."});  // 비밀번호 찾기를 한 적이 없음
    });
});

module.exports = api;
