const jwt = require('jsonwebtoken');
const secretObj = require("./jwt.js");
const db = require('./database.js');

exports.verifyToken = (req, res, next) => {
    try {
        const clientToken = req.headers.token;
        const decoded = jwt.verify(clientToken, secretObj.secret);

        if (decoded) {
            console.log('token success');
            var token_check_sql = "select token from user_log where userUID = ? "
                                + "order by regDate desc "
                                + "limit 1";

            db.query(token_check_sql, decoded.userUID, function (err, result, fields) {
                if (err) throw err;

                var getToken = clientToken;
                if(getToken != result[0].token){
                    //res.status(403).json({"status":403, "data":[], message:"다른 기기에서 로그인 하여 이 기기에서는 자동으로 로그아웃 되었습니다."});
					next(); // 테스트 때만 풀어놓음
                } else {
                    next();
                }
            });
        } else {
            res.status(403).json({"status":403, "data":[], message:"유효하지 않은 토큰입니다"});
        }
    } catch (err) {
        res.status(403).json({"status":403, "data":[], message:"유효하지 않은 토큰입니다"});
    }
};
    
exports.verifyMobileMembership = (req, res, next) => {
    try {
        const clientToken = req.headers.token;
        const decoded = jwt.verify(clientToken, secretObj.secret);

        if (decoded) {
            console.log('check video token success');
			if(decoded.auth != "mobile"){
				next();
			} else {
				res.status(403).json({"status":403, "data":[], message:"비디오 시청에 대한 권한이 존재하지 않습니다."});
			}
        }
    } catch (err) {
        res.status(403).json({"status":403, "data":[], message:"유효하지 않은 토큰입니다"});
    }
};

exports.verifyMirrorMembership = (req, res, next) => {
    try {
        const clientToken = req.headers.token;
        const decoded = jwt.verify(clientToken, secretObj.secret);

        if (decoded) {
            console.log('check video token success');
			if(decoded.auth != "normal"){

			}
        } else {
            res.status(403).json({"status":403, "data":[], message:"유효하지 않은 토큰입니다"});
        }
    } catch (err) {
        res.status(403).json({"status":403, "data":[], message:"유효하지 않은 토큰입니다"});
    }
};