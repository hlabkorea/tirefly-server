const express = require("express"); 
const db = require('./config/database.js');
const api = express.Router();
const {getPageInfo} = require('./config/paging.js'); 
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const pageCnt10 = 10;

// 웹에서 faq 조회와 검색
// 검색은 무조건 전체에서 (카테고리 상관 없음)
api.get("/web", function(req, res) {
    var sql = "select UID, category, question, answer from faq where type='web'";
    
    var countSqlData = [];
    var sqlData = [];
    var category = req.query.category;
    var searchWord = req.query.searchWord;

    if(category != undefined){
		if(category.length != 0){
			sql += " and category = ?";
			countSqlData.push(category);
			sqlData.push(category);
		}
      
    }

    if(searchWord != undefined){
		if(searchWord.length != 0){
			sql += " and (question LIKE ? or answer LIKE ?)";
      
			for(var i=0; i<2; i++){
				countSqlData.push("%" + searchWord + "%");
				sqlData.push("%" + searchWord + "%");
			}
		}
      
    }

    var countSql = sql + ";";

    sql += " limit ?, " + pageCnt10;
    var currentPage = req.query.page ? parseInt(req.query.page) : 1;
    sqlData.push((parseInt(currentPage) - 1) * pageCnt10);

    db.query(countSql+sql, countSqlData.concat(sqlData), function (err, result) {
      if (err) throw err;

      var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt10);
      res.status(200).json({status:200, 
                data: {
                  paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
                  result: result[1]
                }, 
                message:"success"});
    });
});

// 앱에서 faq 조회
api.get("/app", verifyToken, function(req, res) {
    var sql = "select UID, question, answer from faq where type='app'";

    db.query(sql, function (err, result) {
      if (err) throw err;

	  for(var i in result){
		  result[i].answer = result[i].answer.replace(/\\n/gi, "\n").replace(/\r/gi, "");
	  }

      res.status(200).json({status:200, data: result, message:"success"});
    });
});

// faq 추가
api.post("/", 
        verifyAdminToken, 
        [
          check("category", "category is required").not().isEmpty(),
          check("question", "question is required").not().isEmpty(),
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

// faq 수정
api.put("/:faqUID", 
        verifyAdminToken, 
        [
          check("category", "category is required").not().isEmpty(),
          check("question", "question is required").not().isEmpty(),
          check("answer", "answer is required").not().isEmpty()
        ],
        function(req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
            var sql = 'update faq set category=?, question=?, answer=? where UID = ?';
            var data = [req.body.category, req.body.question, req.body.answer, req.params.faqUID];

            db.query(sql, data, function (err, result) {
              if (err) throw err;

              res.status(200).json({status:200, data: "true", message:"success"});
            });
          }
        }
);

module.exports = api;
