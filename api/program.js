const express = require('express');
const db = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {getPageInfo} = require('./config/paging.js'); 
const {addSearchSql} = require('./config/searchSql.js');
const pageCnt15 = 15;

// cms - 프로그램 정보 조회
api.get('/', 
        verifyToken,
        function (req, res) {
			var searchType = req.query.searchType ? req.query.searchType : '';
			var searchWord = req.query.searchWord ? req.query.searchWord : '';
			var status = req.query.status ? req.query.status : 'act';
			var sql = "select UID as programUID, programThumbnail, programName, programLevel, weekNumber, updateDate, status from program where UID >= 1 ";

			sql += addSearchSql(searchType, searchWord);

			var data = [];

			if(status != "all"){
				sql += "and program.status = ? ";
				data.push(status);
				data.push(status);
			}

			sql += "order by program.UID desc, program.regDate desc ";

			var currentPage = req.query.page ? parseInt(req.query.page) : '';
			if(currentPage != ''){
				var countSql = sql + ";";
				sql += "limit ?, " + pageCnt15;
				data.push(parseInt(currentPage - 1) * pageCnt15);
				
				db.query(countSql+sql, data, function (err, result, fields) {
					if (err) throw err;
					var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt15);

					res.status(200).json({status:200, 
										  data: {
											paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
											result: result[1]
										  }, 
										  message:"success"});
				});
			}
			else {
				db.query(sql, data, function (err, result, fields) {
					if (err) throw err;

					res.status(200).json({status:200, data: result, message:"success"});
				});
			}
        }	
);

// 프로그램 상세 정보 조회
api.get('/:programUID', 
        verifyToken, 
        [
          check("userUID", "userUID is required").not().isEmpty()
        ],
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
				var programUID = req.params.programUID;
				var userUID = req.query.userUID;
				
				// 프로그램 정보 조회
				var sql = "select programName, programContents, contentsPath, programLevel, weekNumber "
						+ "from program left join my_program on program.UID = my_program.programUID "
						+ "where program.UID = ?";
				var data = [programUID, userUID];
				var responseData = {};

				db.query(sql, programUID, function (err, result) {
				  if (err) throw err;   

				  responseData = result[0];

				  // 프로그램을 신청했는지 확인
				  sql = "select UID from my_program where programUID = ? and userUID = ?";

				  db.query(sql, data, function (err, result) {
					if (err) throw err;   

					var isRegister = true;
					if(result.length == 0)
						isRegister = false;
						responseData.register = isRegister;

					res.status(200).json({status:200,  data: responseData, message:"success"});
				  });
				});
			}
        }	
);

module.exports = api;
