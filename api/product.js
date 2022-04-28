const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con, commit } = require('./config/database.js');


// 방문 장착 리스트
// 검색 옵션은 파라미터가 아닌 쿼리스트링 사용
api.get('/search',
    async function (req,res) {
        try {
            
            
            
            // var sql = "select a.UID as UID, thumbnail, b.name as modelName, c.name as mnfctName, bkmCnt, reviewCnt "
            //         + "from product a "
            //         + "join model b on b.UID = a.modelUID "
            //         + "join mnfct c on c.UID = b.mnfctUID "
            //         + "join badge d on d.modelUID = b.UID "
            //         + "where actvt = 1 "
            // 검색 옵션에 있는 모델명을 먼저 불러 온 후 
            const width = req.query.width ? req.query.width : '';
            const radio = req.query.radio ? req.query.radio : '';
            const inch = req.query.inch ? req.query.inch : '';
            const car = req.query.car ? req.query.car : '';
            const performance = req.query.performance ? req.query.performance : '';
            const carFunction = req.query.function ? req.query.function : '';
            var modelSql = "select modelUID from badge where "
            var modelSqlData = [];

            if(car.length > 0) {
                sql += ' and d.name in (?)';
                modelSqlData.push(car);
            }
            if(performance.length > 0){
                sql += ' and d.name in (?)';
                modelSqlData.push(performance);
            }
            if(carFunction.length > 0){
                modelSqlData += ' and d.name in (?)';
            }

            //해당 모델 번호 차량 사이즈 제품 호출
            sql += 'and a.tireSize in (?)';
            sqlData.push(width + "/" + radio + " R" + inch);




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