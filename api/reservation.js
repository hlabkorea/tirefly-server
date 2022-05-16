const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");


// 유저 예약내역 조회
api.get('/',
    verifyToken,
    async function (req, res) {
        try {
            const userUID = req.userUID;
            var sql = "select UID, email, code, name, cellNo, rsDate, rsTime, carType, addr1, addr2, postalCode, memo, keepUID, stts, productUID, "
                    + "orderCnt, ifnull(antProductUID, '') as antProductUID, carNo, carFullName "
                    + "from reservation "
                    + "where userUID = ? "
                    + "group by UID "
                    + "order by rsDate desc, rsTime desc";

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

// 메인화면 예약내역 조회 // :userUID로 받는게 맞는지 확인 필요
api.get('/main',
    verifyToken,
    async function (req, res) {
        try {
            const userUID = req.userUID;
            var sql = "select UID as UID, rsDate, rsTime "
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

//예약내역 상세보기
api.get('/detail/:reservationUID',
    // verifyToken,
    async function (req, res) {
        try {
            // const userUID = req.userUID;
            const reservationUID = req.params.reservationUID;

            var sql = "select a.UID as UID, code, rsDate, rsTime, name, cellNo, email, addr1, addr2, carFullName, b.price, b.tireSize from reservation a " // 스토리보드 69페이지 보관장착인지 구매장착인지 reservation에도 타입이 필요할듯
            sql += "join product b on a.productUID = b.UID " // 가격의 경우 order 테이블에 존재 (2본인지 4본인지 계산하려면 order 테이블 조인 필요)
            sql += "where a.UID = ?"

            const [result] = await con.query(sql, reservationUID);

            res.status(200).json({
                status : 200,
                data : result,
                message : "success"
            })
        } catch (err) {
            throw err;
        }
    }
)



module.exports = api;