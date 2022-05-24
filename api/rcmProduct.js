const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');


api.get('/',
    verifyToken,
    async function (req, res) {
        try {
            var sql = "select b.UID as modelUID, c.name as mnfctName, b.name as modelName, b.thumbnail from rcmProduct a join model b on a.modelUID = b.UID join mnfct c on b.mnfctUID = c.UID where a.stts = 1" //product 의 thumbnail model로 바꾸는게 좋을 것 같음
            const [result] = await con.query(sql);

            res.status(200).json({
                status : 200,
                data : result,
                message : "success"
            })
        } catch (err){
            throw err;
        }
    }
)


module.exports = api;