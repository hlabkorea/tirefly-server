const express = require('express');
const db = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();

// cms - 카테고리의 칼로리 등록
api.post('/', verifyAdminToken, function (req, res) {
    var categoryUID = req.body.categoryUID;
    var adminUID = req.adminUID;
    var lv1Consume = req.body.lv1Consume;
    var lv2Consume = req.body.lv2Consume;
    var lv3Consume = req.body.lv3Consume;

    var lv1Sql = "insert calorie(categoryUID, level, consume, regUID) values(?, '초급', ?, ?);";
    var lv2Sql = "insert calorie(categoryUID, level, consume, regUID) values(?, '중급', ?, ?);";
    var lv3Sql = "insert calorie(categoryUID, level, consume, regUID) values(?, '고급', ?, ?);";
    var data = [categoryUID, lv1Consume, adminUID, categoryUID, lv2Consume, adminUID, categoryUID, lv3Consume, adminUID];

    db.query(lv1Sql + lv2Sql + lv3Sql, data, function (err, result) {
        if (err) throw err;

        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    });
});

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