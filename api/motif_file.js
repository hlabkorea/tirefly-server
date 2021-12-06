const express = require('express');
const db = require('./config/database.js');
const { upload } = require('./config/uploadFile.js');
const api = express.Router();

api.post('/', upload.single("file"), function (req, res) {
    var accName = req.body.accName;
    var adminUID = req.adminUID;
    var status = req.body.status;
    var sql = "insert acc(accName, regUID, status) values(?, ?, ?)";
    var data = [accName, adminUID, status];
    db.query(sql, data, function (err, result) {
        if (err) throw err;
        res.status(200).json({
            status: 200,
            data: {
                accUID: result.insertId
            },
            message: "success"
        });
    }); 
});

api.delete('/', function (req, res) {
    var accName = req.body.accName;
    var adminUID = req.adminUID;
    var status = req.body.status;
    var sql = "insert acc(accName, regUID, status) values(?, ?, ?)";
    var data = [accName, adminUID, status];
    db.query(sql, data, function (err, result) {
        if (err) throw err;
        res.status(200).json({
            status: 200,
            data: {
                accUID: result.insertId
            },
            message: "success"
        });
    }); 
});

module.exports = api;