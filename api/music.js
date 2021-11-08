const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

// 카테고리에 맞는 음악 조회
api.get('/:categoryUID', verifyToken, function (req, res) {
    var sql = "select UID as musicUID, musicName, artist, musicPath from music where categoryUID = ?";
    var data = req.params.categoryUID;

    db.query(sql, data, function (err, result) {
            if (err) throw err;

            res.status(200).json({status:200, data: result, message:"success"});
        });
});

module.exports = api;
