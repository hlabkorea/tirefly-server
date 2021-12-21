const express = require('express');
const db = require('./config/database.js');
const { getPageInfo } = require('./config/paging.js'); 
const { verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const pageCnt10 = 10;

// 공지사항 조회
api.get('/', function (req, res) {
    var category = req.query.category ? req.query.category : '';
    var sql = "select UID as noticeUID, title, contents, category from notice";
    if (category.length != 0)
        sql += ` where category = '${category}'`;

    var countSql = sql + ";";

    var currentPage = req.query.page ? parseInt(req.query.page) : 1;
    currentpage = (parseInt(currentPage) - 1) * pageCnt10;
    sql += ` limit ${currentpage}, ${pageCnt10}`;
    
    

    db.query(countSql + sql, function (err, result) {
        if (err) throw err;

        var {
            startPage,
            endPage,
            totalPage
        } = getPageInfo(currentPage, result[0].length, pageCnt10);

        res.status(200).json({
            status: 200,
            data: {
                paging: {
                    startPage: startPage,
                    endPage: endPage,
                    totalPage: totalPage
                },
                result: result[1]
            },
            message: "success"
        });
    });
});

// 공지사항 추가
api.post('/',
    verifyAdminToken,
    [
        check("title", "title is required").not().isEmpty(),
        check("category", "category is required").not().isEmpty(),
        check("contents", "contents is required").not().isEmpty()
    ],
    function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            var title = req.body.title;
            var contents = req.body.contents;
            var category = req.body.category;
            var adminUID = req.adminUID;
            var sql = 'insert notice(title, contents, category, regUID) values (?, ?, ?, ?)';
            var data = [title, contents, category, adminUID];

            db.query(sql, data, function (err, result) {
                if (err) throw err;

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            });
        }
    }
);

// 공지사항 수정
api.put('/:noticeUID',
    verifyAdminToken,
    [
        check("title", "title is required").not().isEmpty(),
        check("category", "category is required").not().isEmpty(),
        check("contents", "contents is required").not().isEmpty()
    ],
    function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            var noticeUID = req.params.noticeUID;
            var title = req.body.title;
            var contents = req.body.contents;
            var category = req.body.category;
            var adminUID = req.adminUID;
            var sql = 'update notice set title = ?, contents = ?, category = ?, updateUID = ? where UID = ?';
            var data = [title, contents, category, adminUID, noticeUID];

            db.query(sql, data, function (err, result) {
                if (err) throw err;

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            });
        }
    }
);

// 공지사항 삭제
api.delete('/:noticeUID',
    verifyAdminToken,
    function (req, res) {
        var noticeUID = req.params.noticeUID;
        var sql = 'delete from notice where UID = ?';

        db.query(sql, noticeUID, function (err, result) {
            if (err) throw err;

            res.status(200).json({
                status: 200,
                data: "true",
                message: "success"
            });
        });
    }
);

module.exports = api;