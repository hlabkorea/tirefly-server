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
            const userUID = req.userUID;
            const readChk = Number(req.query.readChk);

            var sql = "select UID, psType, title, targetUID, regDate from push where userUID = ?";
            if(readChk == 0){
                sql += " and readChk = 0";
            }
            sql += " order by regDate desc, UID desc";
            const [result] = await con.query(sql, userUID);

            res.status(200).json({
                status : 200,
                data : result,
                message : "success"
            })
        } catch (err) {
            console.log()
        }
    }
)

module.exports = api;