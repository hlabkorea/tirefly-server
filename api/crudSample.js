const express = require('express');
const router = express.Router();
const db = require('./config/database.js');
const jwt = require("jsonwebtoken");
const secretObj = require("./config/jwt.js");
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();

api.get('/', verifyToken, (req, res) => {
    var sql = "select * from user";
    db.query(sql, function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

api.get('/:id', function (req, res) {
    var sql = "select * from user1 where UID =" + req.params.id;
    db.query(sql, function (err, result, fields) {
        if (err) throw err;
        res.json({
            "status": 200,
            "data": result[0],
            message: "성공"
        });
    });
});

api.post('/', function (req, res) {
    var sql = "insert INTO user(userId, password) VALUES ('" + req.body.userId + "', '" + req.body.password + "')";
    db.query(sql, function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

api.put('/:id', function (req, res) {
    var sql = "UPDATE user SET PASSWORD = '" + req.body.password + "' WHERE UID = " + req.params.id;
    db.query(sql, function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

api.delete('/:id', function (req, res) {
    var sql = "delete from user where UID = " + req.params.id;
    db.query(sql, function (err, result, fields) {
        if (err) throw err;
        res.send(result);
    });
});

module.exports = api;
