const express = require('express');
const { con } = require('./config/database.js');
const api = express.Router();

// 인증키에 해당하는 이메일 조회
api.post('/email', async function (req, res) {
    const key = req.body.authKey;
    var sql = "select email from pwd_auth " +
            "where authKey = ? and date_format(now(), '%Y-%m-%d') <= date_add(regDate, interval 1 day)";
    const [result] = await con.query(sql, key);

    if(result.length == 0) // 비밀번호 찾기를 한 적이 없거나 유효시간이 만료되었을 경우
        res.status(403).json({
            status: 403,
            data: "false",
            message: "비밀번호 변경에 대한 권한이 없는 계정입니다."
        }); 
    else 
        res.status(200).json({
            status: 200,
            data: result[0].email,
            message: "success"
        });
});

module.exports = api;
