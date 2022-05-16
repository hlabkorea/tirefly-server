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

api.post('/addKeep',
    verifyToken,
    async function (req, res){
        const errors = getError(req, res);
        if(errors.isEmpty()){
            const userUID = req.userUID;
            const keepNo = req.body.keepNo;
            const updateDate = new Date();

            // 비회원 예약내역 확인
            var nonUserKeepDataSql = "select * from keep where keepNo = ? and regUser = 0"
            const [nonUserKeepData] = await con.query(nonUserKeepDataSql, keepNo);

            const keepUID = nonUserKeepData[0].UID;

            if(nonUserKeepData == null){
                res.status(403).json({
                    status : 403,
                    data : "null",
                    message : "존재하지 않는 보관건입니다."
                })
            } else {
                var sql = "update keep set regUser = ?, updateDate = ? where UID = ?";
                var sqlData = [userUID, updateDate, keepUID];

                const [result] = await con.query(sql, sqlData);

                res.status(200).json({
                    status : 200,
                    data : "true",
                    message : "success"
                })
            }

        }
    }
)

module.exports = api;