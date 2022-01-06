const express = require("express"); 
const { con } = require('./config/database.js');
const api = express.Router();
const { getPageInfo } = require('./config/paging.js'); 
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const pageCnt10 = 10;

// faq 리스트 조회
api.get("/", verifyAdminToken, async function(req, res) {
    try{
        var sql = "select UID, category, question, answer, type from faq";
        var type = req.query.type ? req.query.type : 'all';
        var currentPage = req.query.page ? parseInt(req.query.page) : 1;

        if (type != "all") 
            sql += ` where type = '${type}'`;
     
         sql += " order by regDate desc, UID desc";
         var countSql = sql + ";";
     
         sql += ` limit ${(parseInt(currentPage) - 1) * pageCnt10}, ${pageCnt10}`;
        const [result] = await con.query(countSql+sql);
        var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt10);
        res.status(200).json({status:200, 
                data: {
                  paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
                  result: result[1]
                }, 
                message:"success"});
    } catch (err) {
        throw err;
    }
});

// 웹에서 faq 조회와 검색
api.get("/web", async function(req, res) {
    try{
        var category = req.query.category ? req.query.category : '';
        var searchWord = req.query.searchWord ? req.query.searchWord : '';
        var currentPage = req.query.page ? parseInt(req.query.page) : 1;

        var sql = "select UID, category, question, answer from faq where type='web'";
        
        if(category.length != 0)
            sql += ` and category = '${category}'`;

        if(searchWord.length != 0)
            sql += ` and (question LIKE '%${searchWord}%' or answer LIKE '${searchWord}')`;

        sql += " order by regDate desc, UID desc";
        var countSql = sql + ";";

        sql += ` limit ${(parseInt(currentPage) - 1) * pageCnt10}, ${pageCnt10}`;

        const [result] = await con.query(countSql+sql);
        var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt10);
        res.status(200).json({status:200, 
                    data: {
                    paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
                    result: result[1]
                    }, 
                    message:"success"});
    } catch (err) {
        throw err;
    }
});

// 앱에서 faq 조회
api.get("/app", verifyToken, async function(req, res) {
    try{
        var sql = "select UID, question, answer from faq where type='app' order by regDate desc, UID desc";
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

// cms - faq 상세조회
api.get("/:faqUID", verifyAdminToken, async function(req, res) {
    try{
        var faqUID = req.params.faqUID;
        var sql = "select category, question, answer, type from faq where UID = ?";
        const [result] = await con.query(sql, faqUID);
        res.status(200).json({
            status: 200,
            data: result[0],
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// faq 추가
api.post("/", 
        verifyAdminToken, 
        [
          check("question", "question is required").not().isEmpty(),
          check("answer", "answer is required").not().isEmpty(),
		  check("type", "type is required").not().isEmpty()
        ],
        async function(req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
            try{
                var adminUID = req.adminUID;
                var category = req.body.category;
                var question = req.body.question;
                var answer = req.body.answer;
                var type = req.body.type;

                var sql = 'insert faq(category, question, answer, type, regUID) values (?)';
                var data = [category, question, answer, type, adminUID];

                await con.query(sql, [data]);
                res.status(200).json({status:200, data: "true", message:"success"});
            } catch (err) {
                throw err;
            }
          }
        }
);

// faq 수정
api.put("/:faqUID", 
        verifyAdminToken, 
        [
          check("question", "question is required").not().isEmpty(),
          check("answer", "answer is required").not().isEmpty(),
		  check("type", "type is required").not().isEmpty()
        ],
        async function(req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
            try{
                var adminUID = req.adminUID;
                var faqUID = req.params.faqUID;
                var category = req.body.category;
                var question = req.body.question;
                var answer = req.body.answer;
                var type = req.body.type;
                var sql = 'update faq set category=?, question=?, answer=?, type = ?, updateUID = ? where UID = ?';
                var data = [category, question, answer, type, adminUID, faqUID];
                await con.query(sql, data);
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

// faq 삭제
api.delete('/:faqUID',
    verifyAdminToken,
    async function (req, res) {
        try{
            var faqUID = req.params.faqUID;
            var sql = 'delete from faq where UID = ?';
            await con.query(sql, faqUID);
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
