const express = require('express');
const db = require('./config/database.js');
const {verifyToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');

//나의관심 운동 등록 (기존데이터 삭제후 새로운 데이터 삽입)
api.post('/', 
        verifyToken, 
        [
			check("userId", "userId is required").not().isEmpty(),
			check("acc", "acc is required").not().isEmpty()
		], 
        function (req, res, next) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                var sql = "delete from my_acc where userUID = ?";

                db.query(sql, req.body.userId, function (err, result, fields) {
                    if (err) throw err;

                    console.log(result +"delete");
                    var data = [];
                    var acc = JSON.parse(req.body.acc);

                    for(var i in acc){
                        data.push([req.body.userId, acc[i]]);
                    }

                    var sql = "insert INTO my_acc(userUID, accUID) VALUES ?;";
                    db.query(sql, [data], function (err, result, fields) {
                        if (err) throw err;

                        console.log(result +"insert")
                        res.status(200).send({status:200, data: "true", message:"success"});
                    });
                });
            }
        }
);

module.exports = api;
