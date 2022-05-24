const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");

api.get('/',
    verifyToken,
    async function (req, res) {
        try {
            const userUID = req.userUID;

            var sql = "select UID, keepNo, startDate, endDate from keep where regUser = ?" // 타이어 사이즈 및 모델 정보가 필요한데 keepUID, orderUID만 가지고는 알 수 없음
            const [result] = await con.query(sql, userUID);

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

api.post('/',
    verifyToken,
    async function (req, res){
        const errors = getError(req, res);
        if(errors.isEmpty()){
            const userUID = req.userUID;
            const keepNo = req.body.keepNo;
            const updateDate = new Date();

            // 비회원 보관내역 확인
            var nonUserKeepDataSql = "select * from keep where keepNo = ? and regUser = 0"
            const [nonUserKeepData] = await con.query(nonUserKeepDataSql, keepNo);


            if(nonUserKeepData.length == 0){
                res.status(403).json({
                    status : 403,
                    data : "false",
                    message : "해당 보관코드가 존재하지 않습니다."
                })
            } else {
                const keepUID = nonUserKeepData[0].UID;
                var sql = "update keep set regUser = ?, updateDate = ? where UID = ?";
                var sqlData = [userUID, updateDate, keepUID];
                var orderSql = "update `order` set regUser = ?, updateDate = ?, updateUser = ? where keepUID = ?"
                var orderSqlData = [userUID, updateDate, userUID, keepUID]

                //예약내역

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

api.get('/nonUser/detail',
    async function ( req, res ) {
        try {
            const keepNo = req.body.keepNo;


            var sql = "select * from keep where keepNo = ? and regUser = 0"
            const [result] = await con.query(sql, keepNo);

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

module.exports = api;