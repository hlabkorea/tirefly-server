const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');

api.put('/:productUID',
    verifyToken,
    async function (req, res) {
        const error = getError(req, res);
        if(error.isEmpty()){
            try {
                const productUID = Number(req.params.productUID);
                const userUID = req.userUID;
                const regDate = new Date();

                var overlapSql = "select * from favorite where productUID = ? and userUID = ?"
                var overlapSqlData = [productUID, userUID];
                const [overlapFavorite] = await con.query(overlapSql, overlapSqlData); 

                if(overlapFavorite.length > 0) {

                    var delSql = "delete from favorite where productUID = ? and userUID = ?";
                    var delSqlData = [productUID, userUID];
                    await con.query(delSql, delSqlData);
                    // 즐겨찾기 count - 1
                    var bkmCntSql = "update product set bkmCnt = bkmCnt - 1 where UID = ?";
                    const bkmCntSqlData = [productUID];
                    await con.query(bkmCntSql, bkmCntSqlData);
                    res.status(200).json({status:200, data: "true", message:"즐겨찾기가 해지되었습니다."});
                } else {
                    var sql = "insert favorite(productUID, userUID, regDate) values (?, ?, ?);"
                    var sqlData = [productUID, userUID, regDate];
                    await con.query(sql, sqlData);
                    // 즐겨찾기 count + 1
                    var bkmCntSql = "update product set bkmCnt = bkmCnt + 1 where UID = ?";
                    const bkmCntSqlData = [productUID];
                    await con.query(bkmCntSql, bkmCntSqlData);
                    res.status(200).json({status:200, data: "true", message:"즐겨찾기에 등록되었습니다."});
                }

            } catch (err){
                console.log(err);
                throw err;
            }
        }
    }
)


module.exports = api;