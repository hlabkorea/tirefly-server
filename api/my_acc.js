const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

//나의 보유 악세사리 등록 (기존데이터 삭제후 새로운 데이터 삽입)
api.post('/', 
        verifyToken, 
        [
			check("userId", "userId is required").not().isEmpty(),
			check("acc", "acc is required").not().isEmpty()
		], 
        async function (req, res, next) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const userUID = req.body.userId;
                    const accUIDs = JSON.parse(req.body.acc);

                    await deleteMyAcc(userUID);
                    await insertMyAcc(userUID, accUIDs);

                    res.status(200).send({status:200, data: "true", message:"success"});
                } catch (err){
                    throw err;
                }
            }
        }
);

// 나의 보유 악세사리 삭제
async function deleteMyAcc(userUID){
    var sql = "delete from my_acc where userUID = ?";
    await con.query(sql, userUID);
}

// 나의 보유 악세사리 등록
async function insertMyAcc(userUID, accUIDs){
    var sqlData = [];

    for(var i in accUIDs){
        sqlData.push([userUID, accUIDs[i]]);
    }

    if(accUIDs.length != 0){						
        var sql = "insert INTO my_acc(userUID, accUID) VALUES ?;";
        await con.query(sql, [sqlData]);
    }
}

module.exports = api;
