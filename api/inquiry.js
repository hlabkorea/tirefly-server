const express = require("express"); 
const db = require('./config/database.js');
const api = express.Router();
const {upload} = require('./config/uploadFile.js');
const {getPageInfo} = require('./config/paging.js'); 
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const {check} = require('express-validator');
const {sendInquiryMail} = require('./config/mail.js');
const {getError} = require('./config/requestError.js');
const userPageCnt = 10;

// 문의 조회
api.get("/", verifyAdminToken, function(req, res) {
    var countSql = "select count(*) as totalPost from inquiry;";
    var sql = "select * from inquiry limit ?, ?";
    var currentPage = req.query.page ? parseInt(req.query.page) : 1;
    var data = [(parseInt(currentPage) - 1) * userPageCnt, userPageCnt];

    db.query(countSql+sql, data, function (err, result) {
      if (err) throw err;
      
      var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0][0].totalPost, userPageCnt);
      res.status(200).json({status:200, 
                data: {
                  paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
                  result: result[1]
                }, 
                message:"success"});
    });
});

// 문의 하기
api.post("/", 
        [
          check("type", "type is required").not().isEmpty(),
          check("title", "title is required").not().isEmpty(),
          check("name", "name is required").not().isEmpty(),
          check("email", "email is required").not().isEmpty(),
          check("contents", "contents is required").not().isEmpty()
        ],
        function(req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
			var type = req.body.type;
			var title = req.body.title;
			var name = req.body.name;
			var email = req.body.email;
			var group = req.body.group;
			var cellNumber = req.body.cellNumber;
			var contents = req.body.contents;

			sendInquiryMail(type, title, name, email, group, cellNumber, contents);

            var sql = 'insert inquiry(inquiryType, inquiryTitle, userName, userEmail, userGroup, userCellNumber, inquiryContents, inquiryComplete) '
                    + 'values (?, ?, ?, ?, ?, ?, ?, 0);';
            var data = [type, title, name, email, group, cellNumber, contents];

            db.query(sql, data, function (err, result) {
              if (err) throw err;

              res.status(200).json({status:200, data: "true", message:"success"});
            });
          }
        }
);

// 문의할 때 파일 첨부하기
api.put("/file/:inquiryUID", upload.single("file"), function(req, res) {
    var sql = 'update inquiry set inquiryFilePath=? where UID=?';
    var data = [req.file.filename, req.params.inquiryUID];

    db.query(sql, data, function (err, result) {
      if (err) throw err;

      res.status(200).json({status:200, data: "true", message:"success"});
    });
});

// 문의 완료하기
api.put("/complete/:inquiryUID", 
        verifyAdminToken, 
        [
          check("type", "type is required").not().isEmpty(),
          check("title", "title is required").not().isEmpty(),
          check("name", "name is required").not().isEmpty(),
          check("email", "email is required").not().isEmpty(),
          check("contents", "contents is required").not().isEmpty()
        ],
        function(req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
            var sql = 'update inquiry set inquiryType=?, inquiryTitle=?, userName=?, userEmail=?, userGroup=?, userCellNumber=?, inquiryContents=?, inquiryComplete=1 where UID=?';
            var data = [req.body.type, req.body.title, req.body.name, req.body.email, req.body.group, req.body.cellNumber, req.body.contents, req.params.inquiryUID];

            db.query(sql, data, function (err, result) {
                if (err) throw err;

                res.status(200).json({status:200, data: "true", message:"success"});
            });
          }
        }
);

module.exports = api;
