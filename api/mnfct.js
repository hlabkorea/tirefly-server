const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');


// 상품 검색 용 제조사 및 모델 조회
api.get('/',
    verifyToken,
    async function (req, res) {
        var sql = "select a.UID as modelUID, b.UID as mnfctUID, b.name as mnfctName, a.name as modelName from model a join mnfct b on b.UID = a.mnfctUID"

        const [result] = await con.query(sql);

        res.status(200).json({
            status : 200,
            data : result,
            message : "success"
        })
    }
)


module.exports = api;