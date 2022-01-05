const express = require("express"); 
const db = require('./config/database.js');
const api = express.Router();
const { upload } = require('./config/uploadFile.js');
const { getPageInfo } = require('./config/paging.js'); 
const { verifyAdminToken } = require("./config/authCheck.js");
const { check } = require('express-validator');
const { sendInquiryMail } = require('./config/mail.js');
const { getError } = require('./config/requestError.js');
const pageCnt10 = 10;

// 문의 조회
api.get("/", verifyAdminToken, function(req, res) {
    var sql = "select inquiry.UID as inquiryUID, inquiry.inquiryType, inquiry.inquiryTitle, inquiry.inquiryContents, inquiry.userName, inquiry.userEmail, inquiry.userGroup, "
            + "inquiry.userCellNumber, inquiry.inquiryComplete, ifnull(completeMsg, '') as completeMsg, ifnull(admin.name, '') as adminName, inquiry.regDate, inquiry.updateDate "
            + "from inquiry "
            + "left join admin on inquiry.updateUID = admin.UID ";
    var currentPage = req.query.page ? parseInt(req.query.page) : 1;
	var complete = req.query.complete ? req.query.complete : 'all';

	if(complete != 'all')
		sql += " where inquiry.inquiryComplete = " + complete; 
	
	var countSql = sql + ";";
	sql += " order by inquiry.regDate desc, inquiry.UID desc";
    sql += " limit ?, " + pageCnt10;
    var currentPage = req.query.page ? parseInt(req.query.page) : 1;
    var data = (parseInt(currentPage) - 1) * pageCnt10;

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

// cms - 문의 상세조회
api.get("/:inquiryUID", verifyAdminToken, function(req, res) {
	var inquiryUID = req.params.inquiryUID;
    var sql = "select inquiryType, inquiryTitle, inquiryContents, userName, userEmail, userGroup, userCellNumber, inquiryComplete, ifnull(completeMsg, '') as completeMsg "
            + "from inquiry where UID = ?";

    db.query(sql, inquiryUID, function (err, result) {
      if (err) throw err;

      res.status(200).json({status:200, data: result[0], message:"success"});
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
                    + 'values (?, ?, ?, ?, ?, ?, ?, 0)';
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
    var sql = 'update inquiry set inquiryFilePath = ? where UID = ?';
    var data = [req.file.filename, req.params.inquiryUID];

    db.query(sql, data, function (err, result) {
      if (err) throw err;

      res.status(200).json({status:200, data: "true", message:"success"});
    });
});

// 문의 완료하기
api.put("/:inquiryUID", 
        verifyAdminToken, 
        [
          check("completeMsg", "completeMsg is required").not().isEmpty()
        ],
        function(req, res) {
          const errors = getError(req, res);
          if(errors.isEmpty()){
			var adminUID = req.adminUID;
			var inquiryUID = req.params.inquiryUID;
            var completeMsg = req.body.completeMsg;
            console.log(completeMsg);
            var sql = 'update inquiry set completeMsg = ?, inquiryComplete=1, updateUID = ? where UID = ?';
            var data = [completeMsg, adminUID, inquiryUID];

            db.query(sql, data, function (err, result) {
                if (err) throw err;

                res.status(200).json({status:200, data: "true", message:"success"});
            });
          }
        }
);

module.exports = api;
