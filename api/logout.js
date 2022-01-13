const express = require('express');
const { con } = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();

// 로그아웃
api.delete('/', verifyToken, async function (req, res) {
    try{
        const token = req.headers.token;
        var sql = "delete from user_log where token = ?";
        await con.query(sql, token);

        res.status(200).json({status:200, data: "true", message:"success"});
    } catch (err) {
        throw err;
    }
});

module.exports = api;