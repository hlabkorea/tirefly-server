const express = require('express');
const { con } = require('./config/database.js');
const db = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// cms - 카테고리의 칼로리 등록
api.post('/', 
        verifyAdminToken, 
        [
            check("categoryUID", "categoryUID is required").not().isEmpty(),
            check("lv1Consume", "lv1Consume is required").not().isEmpty(),
            check("lv2Consume", "lv2Consume is required").not().isEmpty(),
            check("lv3Consume", "lv3Consume is required").not().isEmpty(),
            check("status", "status is required").not().isEmpty()
        ], 
        async function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    var categoryUID = req.body.categoryUID;
                    var adminUID = req.adminUID;
                    var lv1Consume = req.body.lv1Consume;
                    var lv2Consume = req.body.lv2Consume;
                    var lv3Consume = req.body.lv3Consume;
                    var status = req.body.status;

                    var lv1Sql = "insert calorie(categoryUID, level, consume, status, regUID) values(?);";
                    var lv2Sql = "insert calorie(categoryUID, level, consume, status, regUID) values(?);";
                    var lv3Sql = "insert calorie(categoryUID, level, consume, status, regUID) values(?);";
                    var data = [];
                    data.push([categoryUID, '초급', lv1Consume, adminUID, status]);
                    data.push([categoryUID, '중급', lv2Consume, adminUID, status]);
                    data.push([categoryUID, '고급', lv3Consume, adminUID, status]);

                    await con.query(lv1Sql + lv2Sql + lv3Sql, data);
                    res.status(200).json({
                        status: 200,
                        data: "true",
                        message: "success"
                    });
                } catch (err) {
                    throw err;
                }
            }
        }
);

// cms - 카테고리의 칼로리 조회
api.get('/:categoryUID', verifyAdminToken, function (req, res) {
    var categoryUID = req.params.categoryUID;
    var sql = "select UID as calorieUID, level, consume from calorie where categoryUID = ?";

    db.query(sql, categoryUID, function (err, result) {
        if (err) throw err;

        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

// cms - 카테고리의 칼로리 수정
api.put('/:categoryUID', verifyAdminToken, function (req, res) {
    var adminUID = req.adminUID;
    var calorieList = req.body.calorieList;
    var categoryUID = req.params.categoryUID;
    var sql = "";
    var data = [];
    for (var i in calorieList) {
        var consume = calorieList[i].consume;
        var calorieUID = calorieList[i].calorieUID;
        sql += "update calorie set categoryUID = ?, consume = ?, updateUID = ? where UID = ?;";
        data.push(categoryUID);
        data.push(consume);
        data.push(adminUID);
        data.push(calorieUID);
    }

    db.query(sql, data, function (err, result) {
        if (err) throw err;

        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    });
});

module.exports = api;