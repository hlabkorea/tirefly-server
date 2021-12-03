const express = require('express');
const db = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

//악세사리 조회
api.get('/', async function (req, res) {
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
api.post('/', 
        verifyAdminToken,
        [
            check("accName", "accName is required").not().isEmpty(),
            check("status", "status is required").not().isEmpty()
        ], 
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
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
            }
        }
);

// cms - 악세사리 이미지 업로드
api.put('/image/:accUID',
        verifyAdminToken,
        upload.single("img"),
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
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
        }
);

// cms - 악세사리 활성화 여부 수정
api.put('/status/:accUID', 
        verifyAdminToken, 
        [
            check("status", "status is required").not().isEmpty()
        ],
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
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
            }
        }
);

// cms - 악세사리 수정
api.put('/:accUID', 
        verifyAdminToken, 
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                var accUID = req.params.accUID;
                var accName = req.body.accName;
                var status = req.body.status;
                var adminUID = req.adminUID;
                var sql = "update acc set accName = ?, status = ?, updateUID = ? where UID = ?";
                var data = [accName, status, adminUID, accUID];
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
            }
        }
);

// mysql2 버전
/*
const { con2 } = require('./config/database');

// create
try{
    const query = 'insert acc(accName, status) values("테스트2", "inact")';
    const [rows, fields] = await con2.query(query);
    res.status(200).json({
        status: 200,
        data: {
            accUID: rows.insertId
        },
        message: "success"
    });
} catch (err) {
    throw err;
}

// read
try{
    const query = 'select UID, accName, imgPath, actImgPath, rectImgPath, status from acc';
    const [result] = await con2.query(query);
    res.status(200).json({
        status: 200,
        data: result,
        message: "success"
    });
} catch (err) {
    throw err;
}

// update
try{
    const query = `update acc set accName = '수정테스트' where UID = 18`;
    const [rows, fields] = await con2.query(query);
    res.status(200).json({
        status: 200,
        data: "true",
        message: "success"
    });
} catch (err) {
    throw err;
}

// delete
try{
    const query = 'delete from acc where UID = 20';
    const [rows, fields] = await con2.query(query);
    res.status(200).json({
        status: 200,
        data: "true",
        message: "success"
    });
} catch (err) {
    throw err;
}

*/ 

module.exports = api;