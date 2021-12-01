const express = require('express');
const db = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();

//악세사리 조회
api.get('/', function (req, res) {
    var type = req.query.type ? req.query.type : '';
    var sql = "select UID, accName, imgPath, actImgPath, rectImgPath, status from acc ";
    if (type != "cms")
        sql += "where status = 'act'";
    db.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

// cms - 악세사리 상세조회
api.get('/:accUID', function (req, res) {
    var accUID = req.params.accUID;
    var sql = "select accName, imgPath, actImgPath, rectImgPath, status from acc where UID = ?";
    db.query(sql, accUID, function (err, result) {
        if (err) throw err;

        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

// cms - 악세사리 등록
api.post('/', verifyAdminToken, function (req, res) {
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

// cms - 악세사리 이미지 업로드
api.put('/image/:accUID',
    verifyAdminToken,
    upload.single("img"),
    function (req, res) {
        var accUID = req.params.accUID;
        var filename = req.file.filename;
        var imgType = req.body.imgType;
        var sql = "update acc set " + imgType + " = ? where UID = ?";
        var data = [filename, accUID];
        db.query(sql, data, function (err, result, fields) {
            if (err) throw err;

            res.status(200).json({
                status: 200,
                data: {
                    filename: filename
                },
                message: "success"
            });
        });
    }
);

// cms - 악세사리 활성화 여부 수정
api.put('/status/:accUID', verifyAdminToken, function (req, res) {
    var accUID = req.params.accUID;
    var status = req.body.status;
    var sql = "update acc set status = ? where UID = ?";
    var data = [status, accUID];
    db.query(sql, data, function (err, result, fields) {
        if (err) throw err;

        res.status(200).send({
            status: 200,
            data: "true",
            message: "success"
        });
    });
});

// cms - 악세사리 수정
api.put('/:accUID', verifyAdminToken, function (req, res) {
    var accUID = req.params.accUID;
    var accName = req.body.accName;
    var status = req.body.status;
    var adminUID = req.adminUID;
    var sql = "update acc set accName = ?, status = ? where UID = ?";
    var data = [accName, status, accUID];
    db.query(sql, data, function (err, result) {
        if (err) throw err;
        res.status(200).json({
            status: 200,
            data: {
                accUID: "true"
            },
            message: "success"
        });
    });
});

module.exports = api;