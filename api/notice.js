const express = require('express');
const { con } = require('./config/database.js');
const { getPageInfo } = require('./config/paging.js'); 
const { verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const pageCnt10 = 10;

// 공지사항 조회
api.get('/', async function (req, res) {
    try{
        const category = req.query.category ? req.query.category : ''; // 일반, 행사/이벤트
        const currentPage = req.query.page ? parseInt(req.query.page) : 1;
        const offset = (parseInt(currentPage) - 1) * pageCnt10;

        var sql = "select UID as noticeUID, title, contents, category from notice";
        if (category.length != 0)
            sql += ` where category = '${category}'`;

        var countSql = sql + ";";
    
        sql += " order by regDate desc, UID desc "
             + ` limit ${offset}, ${pageCnt10}`;

        const [result] = await con.query(countSql + sql);
        const {
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
    } catch (err) {
        throw err;
    }
    
});

// cms - 공지사항 상세정보 조회
api.get("/:noticeUID", verifyAdminToken, async function(req, res) {
    try{
        const noticeUID = req.params.noticeUID;
        var sql = "select title, contents, category from notice where UID = ?";
        const [result] = await con.query(sql, noticeUID);

        res.status(200).json({status:200, data: result[0], message:"success"});
    } catch (err) {
        throw err;
    }
});

// cms - 공지사항 등록
api.post('/',
    verifyAdminToken,
    [
        check("title", "title is required").not().isEmpty(),
        check("category", "category is required").not().isEmpty(),
        check("contents", "contents is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const adminUID = req.adminUID;
                const title = req.body.title;
                const contents = req.body.contents;
                const category = req.body.category;

                var sql = "insert notice(title, contents, category, regUID) values (?)";
                const sqlData = [title, contents, category, adminUID];
                await con.query(sql, [sqlData]);

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// cms - 공지사항 상세정보 수정
api.put('/:noticeUID',
    verifyAdminToken,
    [
        check("title", "title is required").not().isEmpty(),
        check("category", "category is required").not().isEmpty(),
        check("contents", "contents is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const adminUID = req.adminUID;
                const noticeUID = req.params.noticeUID;
                const title = req.body.title;
                const contents = req.body.contents;
                const category = req.body.category;
                var sql = "update notice set title = ?, contents = ?, category = ?, updateUID = ? where UID = ?";
                const sqlData = [title, contents, category, adminUID, noticeUID];

                await con.query(sql, sqlData);

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// cms - 공지사항 삭제
api.delete('/:noticeUID',
    verifyAdminToken,
    async function (req, res) {
        try{
            const noticeUID = req.params.noticeUID;
            var sql = "delete from notice where UID = ?";
            await con.query(sql, noticeUID);

            res.status(200).json({
                status: 200,
                data: "true",
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

module.exports = api;