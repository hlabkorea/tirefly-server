const express = require('express');
const db = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 공지사항 조회
api.get('/', async function (req, res) {
    var type = req.query.type ? req.query.type : '';
    var sql = "select UID, title, contents, regDate, updateDate from notice";
    if (type.length != 0)
        sql += ` where type = ${type}`;
        
    db.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

// 공지사항 추가
api.post('/',
        verifyAdminToken, 
        [
            check("title", "title is required").not().isEmpty(),
            check("contents", "contents is required").not().isEmpty(),
            check("answer", "answer is required").not().isEmpty()
        ],
        function(req, res) {
            const errors = getError(req, res);
            if(errors.isEmpty()){
                var sql = 'insert faq(category, question, answer) values (?, ?, ?)';
                var data = [req.body.category, req.body.question, req.body.answer];

                db.query(sql, data, function (err, result) {
                    if (err) throw err;

                    res.status(200).json({status:200, data: "true", message:"success"});
                });
            }
        }
);

// 공지사항 수정
api.put('/', async function (req, res) {
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

// 공지사항 삭제


module.exports = api;