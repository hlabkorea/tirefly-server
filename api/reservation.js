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
            var sql = "select a.UID, e.name as mnfctName, d.name as modelName, c.tireSize, a.code, a.rsDateTime, b.orderType, a.stts, d.thumbnail from reservation a "
            sql += "join `order` b on a.UID = b.reservationUID "
            sql += "join product c on a.productUID = c.UID "
            sql += "join model d on c.modelUID = d.UID "
            sql += "join mnfct e on c.mnfctUID = e.UID "
            sql += "where a.userUID = ?"

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
            var sql = "select UID, rsDateTime, stts from reservation where userUID = ? order by abs(datediff(now(), reservation.rsdateTime)) asc limit 1"
            const [result] = await con.query(sql, userUID);

            const returnData = result[0]

            res.status(200).json({
                status :200,
                data : returnData,
                message : "success"
            });
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
)

api.get('/nonUser/detail',
    async function (req, res) {
        try {
            const code = req.body.code

            var sql = "selecet * from reservation where code = ? and userUID = 0";
            const [result] = await con.query(sql, code);

            res.status(200).json({
                status : 200,
                data : result[0],
                message : "success"
            })
        } catch (err) {
            throw err;
        }
    }
)

api.post('/',
    verifyToken,
    async function (req, res){
        const errors = getError(req, res);
        if(errors.isEmpty()){
            const userUID = req.userUID;
            const code = req.body.keepNo;
            const updateDate = new Date();

            // 비회원 예약내역 확인
            var nonUserDataSql = "select * from reservation where code = ? and regUser = 0"
            const [nonUserKeepData] = await con.query(nonUserDataSql, code);


            if(nonUserKeepData.length == 0){
                res.status(403).json({
                    status : 403,
                    data : "false",
                    message : "해당 예약 존재하지 않습니다."
                })
            } else {
                const reservationUID = nonUserKeepData[0].UID;
                var sql = "update reservation set userUID = ?, updateDate = ? where UID = ?";
                var sqlData = [userUID, updateDate, reservationUID];
                var orderSql = "update `order` set regUser = ?, updateDate = ?, updateUser = ? where reservationUID = ?"
                var orderSqlData = [userUID, updateDate, userUID, reservationUID]
                

                await con.query(sql, sqlData);
                await con.query(orderSql, orderSqlData);

                res.status(200).json({
                    status : 200,
                    data : "true",
                    message : "success"
                })
            }

        }
    }
)

//회원 예약내역 상세보기
api.get('/:reservationUID',
    verifyToken,
    async function (req, res) {
        try {
            // const userUID = req.userUID;
            const reservationUID = req.params.reservationUID;

            var sql = "select a.UID as UID, c.orderType, a.stts, code, rsDateTime, a.name, cellNo, email, addr1, addr2, c.amount, carFullName, a.carNo, e.name as mnfctName, f.name as modelName, b.tireSize from reservation a " // 스토리보드 69페이지 보관장착인지 구매장착인지 reservation에도 타입이 필요할듯
            sql += "join product b on a.productUID = b.UID "
            sql += "join `order` c on a.UID = c.reservationUID "
            sql += "join mnfct e on b.mnfctUID = e.UID "
            sql += "join model f on b.modelUID = f.UID "
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