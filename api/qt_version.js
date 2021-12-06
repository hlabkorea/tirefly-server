const express = require('express');
const db = require('./config/database.js');
const path = require('path');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const { onlyUpload } = require('./config/uploadFile.js');
const fs = require('fs');

// 버전 체크
api.post('/check', function (req, res) {
    var serial = "m005";
    var qtVer = "1.0.0";
    var userQtVer = req.body.version;
    var userSerial = req.body.serial;

    // 일련번호 검사
    if (userSerial != serial)
        res.status(403).json({
            status: 403,
            data: "false",
            message: "유효하지 않은 일련번호입니다."
        });

    if (qtVer == userQtVer)
        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    else
        res.status(403).json({
            status: 403,
            data: {
                fileURL: "https://api.motifme.io/files/motif.tar.gz"
            },
            message: "fail"
        });
});

api.post('/test', onlyUpload.single("motif_file"), function (req, res) {
    res.status(200).json({status:200, data:"true", message: "motif 파일 업로드가 완료되었습니다."});
});

api.get('/test/exist', function (req, res) {
    var filePath = '../motif-server/views/files/motif';

    fs.exists(filePath, function (exists) {
        if(exists){							
            res.status(200).json({status:200, data:"true", message: "motif 파일이 존재합니다."});
        }
        else{
            res.status(403).json({status:403, data:"false", message: "motif 파일이 존재하지 않습니다."});
        }
    });
});

api.delete('/test', function (req, res) {
    var filePath = '../motif-server/views/files/motif';

    // 파일이 존재하면 삭제
    fs.exists(filePath, function (exists) {
        if(exists){							
            fs.unlink(filePath, function (err) {
                if (err) throw err;

                res.status(200).json({status:200, data:"true", message: "motif 파일이 삭제되었습니다."});
            });
        }
        else{
            res.status(403).json({status:403, data:"false", message: "motif 파일이 존재하지 않습니다."});
        }
    });
});

module.exports = api;