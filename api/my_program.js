const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');

// 프로그램 신청하기 / 취소하기 (기존데이터 삭제후 새로운 데이터 삽입)
api.put('/:programUID', 
        verifyToken, 
        [
			check("userUID", "userUID is required").not().isEmpty()
		],
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                var sql = "select UID from my_program where userUID = ? and programUID = ?";

                var data = [req.body.userUID, req.params.programUID];
                var message = "";
                db.query(sql, data, function (err, result, fields) {
                    if (err) throw err;

                    if(result.length > 0){
                        sql = "delete from my_program where UID = ?";
                        data = result[0].UID;
                        message = "프로그램이 취소되었습니다.";
                    } else{
                        sql = "insert into my_program(userUID, programUID) values(?, ?)";
                        message = "프로그램이 시작되었습니다.";
                    }

                    db.query(sql, data, function (err, result, fields) {
                        if (err) throw err;

                        res.status(200).json({status:200, data: "true", message: message});
                    });
                });
            }
        }
);

module.exports = api;