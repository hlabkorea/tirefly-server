const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

//나의 관심 운동 등록 (기존데이터 삭제후 새로운 데이터 삽입)
api.post('/', 
        verifyToken, 
        [
			check("userId", "userId is required").not().isEmpty(),
			check("category", "category is required").not().isEmpty()
		],
        async function (req, res, next) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const userUID = req.body.userId;
                    const categoryUIDs = JSON.parse(req.body.category);

                    await deleteMyCategory(userUID);
                    await insertMyCategory(userUID, categoryUIDs);

                    res.status(200).send({status:200, data: "true", message:"success"});
                } catch (err) {
                    throw err;
                }
            }
        }
);

// 나의 관심 카테고리 삭제
async function deleteMyCategory(userUID){
    var sql = "delete from my_category where userUID = ?";
    await con.query(sql, userUID);
}

// 나의 관심 카테고리 등록
async function insertMyCategory(userUID, categoryUIDs){
    var sqlData = [];

    for(var i in categoryUIDs){
        sqlData.push([userUID, categoryUIDs[i]]);
    }

    if(categoryUIDs.length != 0){						
        var sql = "insert into my_category(userUID, categoryUID) values ?;";
        await con.query(sql, [sqlData]);
    }
}

module.exports = api;
