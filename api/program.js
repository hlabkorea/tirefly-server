const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');

// 프로그램 상세 정보 조회
api.get('/:programUID', 
        verifyToken, 
        [
          check("userUID", "userUID is required").not().isEmpty()
        ],
        function (req, res) {
          const errors = getError(req, res);
			    if(errors.isEmpty()){
            var sql = "select programName, programContents, contentsPath, programLevel, weekNumber "
                    + "from program left join my_program on program.UID = my_program.programUID "
                    + "where program.UID = ?";
            var data = [req.params.programUID, req.query.userUID];
            var responseData = {};

            db.query(sql, data[0], function (err, result) {
              if (err) throw err;   

              responseData = result[0];
            });

            sql = "select UID from my_program where programUID = ? and userUID = ?";

            db.query(sql, data, function (err, result) {
              if (err) throw err;   

              var isRegister = true;
              if(result.length == 0)
                isRegister = false;
                responseData.register = isRegister;

              res.status(200).json({status:200,  data: responseData, message:"success"});
            });
          }
        }
);

module.exports = api;
