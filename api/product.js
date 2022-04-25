const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');


// 방문 장착 리스트
// 검색 옵션은 파라미터가 아닌 쿼리스트링 사용
api.get('/search',
    async function (req,res) {
        try {
            // const width = req.params.width;
            // const radio = req.params.radio;
            // const inch = req.params.inch;
            const sqlData = width + "/" + radio + " R" + inch
            console.log(sqlData);

            var sql = "select a.UID as UID, thumbnail, b.name as modelName, c.name as mnfctName, bkmCnt, reviewCnt "
                    + "from product a "
                    + "join model b on b.UID = a.modelUID "
                    + "join mnfct c on c.UID = b.mnfctUID "
                    + "where actvt = 1 "

            const [result] = await con.query(sql, sqlData);

            res.status(200).json({
                status : 200,
                data : result,
                message : "success"
            })

        } catch (err) {
            console.log("/:tireSize Error ::",err);
            throw err;
        }
    }
)

// 제품 상세보기
api.get("/:productUID",
    async function (req, res) {
        try {
            const productUID = req.params.productUID;

            var sql = "select a.UID as UID, b.name as modelName, c.name as mnfctName, thumbnail, contentsPath, tireSize, modesty, highSpeed, riding, breaking, pricing, price, bkmCnt, reviewCnt "
                    + "from product a "
                    + "join model b on b.UID = a.modelUID "
                    + "join mnfct c on c.UID = b.mnfctUID "
                    + "where a.UID = ? and actvt = 1"

            const [productData] = await con.query(sql, productUID);

            var reviewSql = "select a.UID as UID, review, b.email, a.regDate "
                          + "from review a "
                          + "join user b on b.UID = a.userUID "
                          + "where a.productUID = ? "
                          + "order by a.regDate desc, a.UID desc limit 3"

            const [reviewData] = await con.query(reviewSql, productUID);


            res.status(200).json({
                status : 200,
                data : {
                    "productData" : productData,
                    "reviewData" : reviewData
                },
                message : "success"
            })
        } catch (err) {
            console.log("제품 상세보기 ERROR :: ", err);
            throw err;
        }
    }
)


module.exports = api;