const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");


// 즐겨 찾는 장소 리스트
api.get('/',
    verifyToken,
    async function (req, res) {
        try {
            const userUID = req.userUID;

            var sql = "select UID, name, addr1, addr2, postalCode from myPlace where userUID = ?";
            const [result] = await con.query(sql, userUID);

            res.status(200).json({
                status : 200,
                result : result,
                message : "success"
            })
        } catch (err) {
            console.log('error on get(/myPlace) :: ', err);
        }
    }
)

// 즐겨 찾는 장소 등록
api.post('/',
    verifyToken,
    [
        check("name", "name is required").not().isEmpty(),
        check("addr1", "addr1 is required").not().isEmpty(),
        check("addr2", "addr2 is required").not().isEmpty(),
        check("postalCode", "postalCode is required").not().isEmpty(),
    ],
    async function (req, res) {
        const error = getError(req, res);
        if (error.isEmpty()) {
            try {
                const name = req.body.name;
                const addr1 = req.body.addr1;
                const addr2 = req.body.addr2;
                const postalCode = req.body.postalCode;
                const userUID = req.userUID;
                const regDate = new Date();

                var sql = "insert myPlace(name, addr1, addr2, postalCode, userUID, regDate) values(?)";
                const sqlData = [name, addr1, addr2, postalCode, userUID, regDate];

                await con.query(sql, [sqlData]);

                res.status(200).json({
                    status : 200,
                    data : "true",
                    message : "즐겨찾는 장소 등록이 완료되었습니다."
                })

            } catch (err) {
                console.log('error on post(/myPlace) :: ',err);
                throw err;
            }
        }
    }
)


// 즐겨 찾는 장소 수정
api.put('/:myPlaceUID',
    verifyToken,
    [
        check("name", "name is required").not().isEmpty(),
        check("addr1", "addr1 is required").not().isEmpty(),
        check("addr2", "addr2 is required").not().isEmpty(),
        check("postalCode", "postalCode is required").not().isEmpty(),
    ],
    async function (req, res) {
        const error = getError(req, res);
        if (error.isEmpty()){
            try {
                const name = req.body.name;
                const addr1 = req.body.addr1;
                const addr2 = req.body.addr2;
                const postalCode = req.body.postalCode;
                const UID = req.params.myPlaceUID;
                const updateDate = new Date();

                var sql = "update myPlace set name = ?, addr1 = ?, addr2 = ?, postalCode = ?, updateDate = ? where UID = ?";
                var sqlData = [name, addr1, addr2, postalCode, updateDate, UID]

                await con.query(sql, sqlData);

                res.status(200).json({
                    status : 200,
                    data : "true",
                    message : "success"
                });
            } catch (err) {
                console.log('error on put(/:myplaceUID) :: ', err);
                throw err;
            };
        }
    }
)


api.delete('/:myPlaceUID',
    verifyToken,
    async function (req, res) {
        try {
            const myPlaceUID = req.params.myPlaceUID;
            var sql = "delete from myPlace where UID = ?";
            await con.query(sql, myPlaceUID);
            res.status(200).json({
                status : 200,
                data : "true",
                message : "success"
            });
        } catch (err) {
            console.log('error on delete(/:myPlaceUID) :: ', err);
            throw err;
        }
    }
)




module.exports = api;