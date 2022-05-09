const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");


// 메인화면 예약내역 조회 // :userUID로 받는게 맞는지 확인 필요
api.get('/main',
    verifyToken,
    async function (req, res) {
        try {
            const userUID = req.userUID;
            var sql = "select UID as UID, rsDate, rsTime " //email 추후 차량별명으로 수정예정
                    + "from reservation "
                    + "where userUID = ? and rsDate >= now()"
                    + "order by rsDate asc limit 1"

            const [result] = await con.query(sql, userUID);

            res.status(200).json({
                status :200,
                data : result,
                message : "success"
            });
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
)

// 유저 예약내역 조회
api.get('/:userUID',
    verifyToken,
    async function (req, res) {
        try {
            const userUID = req.userUID;
            var sql = "select UID, email, code, name, cellNo, rsDate, rsTime, carType, addr1, addr2, postalCode, memo, keepUID, stts, productUID, "
                    + "orderCnt, ifnull(antProductUID, ''), carNo, carFullName "
                    + "from reservation "
                    + "where userUID = ? "
                    + "group by UID "
                    + "order by regDate desc";

            const [result] = await con.query(sql, userUID);

            res.status(200).json({
                status : 200,
                data : result,
                message : "success"
            });
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
)



module.exports = api;