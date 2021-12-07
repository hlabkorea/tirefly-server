const express = require('express');
const db = require('./config/database.js');
const path = require('path');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const { onlyUpload } = require('./config/uploadFile.js');
const fs = require('fs');
const md5File = require('md5-file');

// 버전 체크
api.post('/check', verifyToken, function (req, res) {
    var userQtVer = req.body.version;

    var sql = "select version from qt_version order by regDate desc limit 1";
    db.query(sql, function (err, result) {
        if (err) throw err;    
        var qtVer = result[0].version;

        if (qtVer == userQtVer)
            res.status(200).json({
                status: 200,
                data: "true",
                message: "success"
            });
        else{
            const hash = md5File.sync(path.join('/', 'usr', 'share', 'nginx', 'motif-server', 'views', 'files', 'main_01.png'));
            res.status(403).json({
                status: 403,
                data: {
                    version: qtVer,
                    filename: hash,
                    fileURL: "https://api.motifme.io/files/motif.tar.gz"
                },
                message: "fail"
            });
        }
    }); 

    
});

api.post('/test', onlyUpload.single("motif_file"), function (req, res) {
    var version = req.body.version;
    var sql = "insert qt_version(version) values (?)";
    db.query(sql, version, function (err, result) {
        if (err) throw err;

        res.status(200).json({status:200, data:"true", message: "motif 파일 업로드가 완료되었습니다."});
    }); 
});

api.get('/test', function (req, res) {
    var sql = "select UID, version, regDate from qt_version order by regDate desc";
    db.query(sql, function (err, result) {
        if (err) throw err;

        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

api.get('/test/exist', function (req, res) {
    var filePath = '../motif-server/views/files/motif.tar.gz';

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
    var filePath = '../motif-server/views/files/motif.tar.gz';

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

api.delete('/test/:versionUID', function (req, res) {
    var sql = "delete from qt_version where UID = ?";
    var versionUID = req.params.versionUID;

    db.query(sql, versionUID, function (err, result) {
        if (err) throw err;

        res.status(200).json({status:200, data:"true", message: "success"});
    }); 
});

module.exports = api;