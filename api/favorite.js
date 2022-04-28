const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');

api.post('/:productUID',
    verifyToken,
    async function (req, res) {
        const error = getError(req, res);
        if(error.isEmpty()){
            try {
                const productUID = Number(req.params.productUID);
                const userUID = Number(req.body.userUID);
                const regDate = new Date();

                var overlapSql = "select * from favorite where productUID = ? and userUID = ?"
                var overlapSqlData = [productUID, userUID];
                const [overlapFavorite] = await con.query(overlapSql, overlapSqlData); 
                if(overlapFavorite.length > 0) {
                    var delSql = "delete from favorite where UID = ?";
                    var delSqlData = [overlapSqlData[0].UID];
                    await con.query(delSql, delSqlData);
                    res.status(200).json({status:200, data: "true", message:"success"});
                } else {
                    var sql = "insert favorite(productUID, userUID, regDate) values (?, ?, ?);"
                    var sqlData = [productUID, userUID, regDate];
                    await con.query(sql, sqlData);
                    res.status(200).json({status:200, data: "true", message:"success"});
                }

            } catch (err){
                console.log(err);
                throw err;
            }
        }
    }
)


module.exports = api;