const express = require('express');
const db = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {getPageInfo} = require('./config/paging.js'); 
const pageCnt15 = 15;

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
