const db = require('./database.js');

exports.verifyPwdAuth = (req, res, next) => {
    var clientKey = req.body.authKey;
    
    console.log(clientKey);
    if(clientKey == undefined)
        res.status(400).json({status:400, data:"false", message:"authKey is required"});
    else{
        var sql = "select authKey from pwd_auth where email = (select email from pwd_auth where authKey = ?) order by regDate desc limit 1";

        db.query(sql, clientKey, function (err, result, fields) {
            if (err) throw err;
            
            if(result.length != 0){
                if(result[0].authKey == clientKey)
                    next();
                else
                    res.status(403).json({status:403, data:"false", message:"유효하지 않은 키 값입니다."});
            }
            else    
                res.status(403).json({status:403, data:"false", message:"유효하지 않은 키 값입니다."});
        });
    }
};
    
