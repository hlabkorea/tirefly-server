const express = require("express"); 
const db = require('./config/database.js');
const api = express.Router();
const { getPageInfo } = require('./config/paging.js'); 
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const pageCnt10 = 10;

api.get("/", verifyAdminToken, function(req, res) {
    var sql = "select UID, category, question, answer, type from faq";
	var type = req.query.type ? req.query.type : 'all';

	var data = [];

	if (type != "all") {
       sql += " where type = ?";
	   data.push(type);
	   data.push(type);
    }

    sql += " order by regDate desc, UID desc";
    var countSql = sql + ";";

    sql += " limit ?, " + pageCnt10;
    var currentPage = req.query.page ? parseInt(req.query.page) : 1;
    data.push((parseInt(currentPage) - 1) * pageCnt10);

    db.query(countSql+sql, data, function (err, result) {
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


// 웹에서 faq 조회와 검색
// 검색은 무조건 전체에서 (카테고리 상관 없음)
api.get("/web", function(req, res) {
    var sql = "select UID, category, question, answer from faq where type='web'";
    
    var countSqlData = [];
    var sqlData = [];
    var category = req.query.category ? req.query.category : '';
    var searchWord = req.query.searchWord ? req.query.searchWord : '';

    if(category != ''){
		if(category.length != 0){
			sql += " and category = ?";
			countSqlData.push(category);
			sqlData.push(category);
		}
      
    }

    if(searchWord != ''){
		if(searchWord.length != 0){
			sql += " and (question LIKE ? or answer LIKE ?)";
      
			for(var i=0; i<2; i++){
				countSqlData.push("%" + searchWord + "%");
				sqlData.push("%" + searchWord + "%");
			}
		}
      
    }

    sql += " order by regDate desc, UID desc";
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
    var sql = "select UID, question, answer from faq where type='app' order by regDate desc, UID desc";

    db.query(sql, function (err, result) {
      if (err) throw err;

      res.status(200).json({status:200, data: result, message:"success"});
    });
});

// cms - faq 상세조회
api.get("/:faqUID", verifyAdminToken, function(req, res) {
	var faqUID = req.params.faqUID;
    var sql = "select category, question, answer, type from faq where UID = ?";

    db.query(sql, faqUID, function (err, result) {
      if (err) throw err;

      res.status(200).json({status:200, data: result[0], message:"success"});
    });
});

// faq 추가
api.post("/", 
        verifyAdminToken, 
        [
          check("question", "question is required").not().isEmpty(),
          check("answer", "answer is required").not().isEmpty(),
		  check("type", "type is required").not().isEmpty()
        ],
        function(req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
			var adminUID = req.adminUID;
			var category = req.body.category;
			var question = req.body.question;
			var answer = req.body.answer;
			var type = req.body.type;

            var sql = 'insert faq(category, question, answer, type, regUID) values (?, ?, ?, ?, ?)';
            var data = [category, question, answer, type, adminUID];

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
          check("question", "question is required").not().isEmpty(),
          check("answer", "answer is required").not().isEmpty(),
		  check("type", "type is required").not().isEmpty()
        ],
        function(req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
			var adminUID = req.adminUID;
			var faqUID = req.params.faqUID;
			var category = req.body.category;
			var question = req.body.question;
			var answer = req.body.answer;
			var type = req.body.type;
            var sql = 'update faq set category=?, question=?, answer=?, type = ?, updateUID = ? where UID = ?';
            var data = [category, question, answer, type, adminUID, faqUID];

            db.query(sql, data, function (err, result) {
              if (err) throw err;

              res.status(200).json({status:200, data: "true", message:"success"});
            });
          }
        }
);

// faq 삭제
api.delete('/:faqUID',
    verifyAdminToken,
    function (req, res) {
        var faqUID = req.params.faqUID;
        var sql = 'delete from faq where UID = ?';

        db.query(sql, faqUID, function (err, result) {
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
