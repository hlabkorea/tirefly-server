const express = require('express');
const router = express.Router();
const { con } = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();

api.get('/', async (req, res) => {
    try{
        var sql = "select * from user";
        const [result] = await con.query(sql);
        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

api.get('/:id', async function (req, res) {
    try{
        const id = req.params.id;
        var sql = "select * from user where UID = ?";
        const [result] = await con.query(sql, id);
        res.json({
            "status": 200,
            "data": result[0],
            message: "성공"
        });
    } catch (err) {
        throw err;
    }
});

api.post('/', verifyToken, async function (req, res) {
    try{
        const userId = req.body.userId;
        const password = req.body.password;
        var sql = "insert INTO user(userId, password) VALUES (?, ?)";
        const sqlData = [userId, password];
        const [result] = await con.query(sql, sqlData);
        res.json({
            "status": 200,
            "data": result,
            message: "성공"
        });
    } catch (err) {
        throw err;
    }
});

api.put('/:id', async function (req, res) {
    try{
        const id = req.params.id;
        const password = req.body.password;
        var sql = "UPDATE user SET PASSWORD = ? WHERE UID = ?";
        const sqlData = [password, id];
        const [result] = await con.query(sql, sqlData);
        res.json({
            "status": 200,
            "data": result,
            message: "성공"
        });
    } catch (err) {
        throw err;
    }
});

api.delete('/:id', async function (req, res) {
    try{
        const id = req.params.id;
        var sql = "delete from user where UID = ?";
        const [result] = await con.query(sql, id);
        res.json({
            "status": 200,
            "data": result,
            message: "성공"
        });
    } catch (err) {
        throw err;
    }
});

module.exports = api;
