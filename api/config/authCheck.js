const jwt = require('jsonwebtoken');
const secretObj = require("./jwt.js");
const db = require('./database.js');

// token undefined 테스트 
/*exports.verifyToken = (req, res, next) => {
    try {
        const clientToken = req.headers.token;
        const decoded = jwt.verify(clientToken, secretObj.secret);

        if (decoded) {
            console.log('user token success');
            console.log(decoded.auth);
			if(decoded.auth == "admin") // 관리자 계정일 때에는 중복로그인 체크 X
				next();
			else{
				// 중복 로그인 체크
				var token_check_sql = "select token from user_log where userUID = ? "
									+ "order by regDate desc "
									+ "limit 1";

				db.query(token_check_sql, decoded.userUID, function (err, result, fields) {
					if (err) throw err;
                    
                    if(result.length != 0){
                        var getToken = clientToken;
					    if(getToken != result[0].token)
                            res.status(403).json({"status":403, "data":"Unauthorized", message:"다른 기기에서 로그인하여 이 기기에서는 자동으로 로그아웃 되었습니다."});
                    }
					else {
                        req.userUID = decoded.userUID;
						next();
                    }
				});
			}
        } else {
            res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
        }
    } catch (err) {
        res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
    }
};*/

// 유저 토큰 유효성 체크
exports.verifyToken = (req, res, next) => {
    try {
        const clientToken = req.headers.token;
        const decoded = jwt.verify(clientToken, secretObj.secret);

        if (decoded) {
            console.log('user token success');
			if(decoded.auth == "admin") // 관리자 계정일 때에는 중복로그인 체크 X
				next();
			else{
				// 중복 로그인 체크
				var token_check_sql = "select token from user_log where userUID = ? "
									+ "order by regDate desc "
									+ "limit 1";

				db.query(token_check_sql, decoded.userUID, function (err, result, fields) {
					if (err) throw err;

					var getToken = clientToken;
					if(getToken != result[0].token){
						res.status(403).json({"status":403, "data":"Unauthorized", message:"다른 기기에서 로그인하여 이 기기에서는 자동으로 로그아웃 되었습니다."});
					} else {
						next();
					}
				});
			}
        } else {
            res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
        }
    } catch (err) {
        res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
    }
};

// 관리자 권한인지 확인 + 관리자 토큰 유효성 체크
exports.verifyAdminToken = (req, res, next) => {
    try {
        const clientToken = req.headers.token;
        const decoded = jwt.verify(clientToken, secretObj.secret);

        if (decoded) {
            console.log('admin token success');
			if(decoded.auth == "admin"){
				req.adminUID = decoded.adminUID;
				next();
			}
			else
				res.status(403).json({"status":403, "data": [], message:"관리자 계정에 대한 권한이 존재하지 않습니다."});
            
        } else {
            res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
        }
    } catch (err) {
        res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
    }
};

// mobile 멤버십 권한 있는지 확인
exports.verifyMobileMembership = (req, res, next) => {
    try {
        const clientToken = req.headers.token;
        const decoded = jwt.verify(clientToken, secretObj.secret);

        if (decoded) {
            console.log('check video token success');
			if(decoded.auth == "mobile")
				next();
			else 
				res.status(403).json({"status":403, "data": [], message:"비디오 시청에 대한 권한이 존재하지 않습니다."});
        }
    } catch (err) {
        res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
    }
};

// mirror 멤버십 권한 있는지 확인
exports.verifyMirrorMembership = (req, res, next) => {
    try {
        const clientToken = req.headers.token;
        const decoded = jwt.verify(clientToken, secretObj.secret);

        if (decoded) {
            console.log('check video token success');
            if(decoded.auth == "normal")
                res.status(403).json({"status":403, "data": [], message:"비디오 시청에 대한 권한이 존재하지 않습니다."});
			else 
                next();
        } else {
            res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
        }
    } catch (err) {
        res.status(403).json({"status":403, "data": "Unauthorized", message:"유효하지 않은 토큰입니다"});
    }
};