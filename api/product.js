const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con, commit } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');


// 방문 장착 리스트
// 검색 옵션은 파라미터가 아닌 쿼리스트링 사용
api.get('/search',
    async function (req,res) {
        try {
            const badge = req.query.badge ? req.query.badge : '';
            const width = req.query.width ? req.query.width : '';
            const radio = req.query.radio ? req.query.radio : '';
            const inch = req.query.inch ? req.query.inch : '';
            const favorite = req.query.favorite ? req.query.favorite : '';
            const userUID = req.query.userUID ? req.query.userUID : '';
            const mnfctUID = req.query.mnfctUID ? req.query.mnfctUID : '';
            // const performance = req.query.performance ? req.query.performance : '';
            // const carFunction = req.query.function ? req.query.function : '';
            // 검색 옵션에 있는 모델명을 먼저 불러 온 후 
            var sqlData = [];

            var sql = "select b.UID, e.imgPath as badgeImg, ifnull(a.thumbnail, '') as thumbnail, a.name as modelName, c.name as mnfctName, b.price, b.bkmCnt, b.reviewCnt "
            +"from model a "
            +"join product b on b.modelUID = a.UID "
            +"join mnfct c on c.UID = a.mnfctUID "
            +"join modelBadge d on a.UID = d.modelUID "
            +"join badge e on d.badge = e.UID "
            if(favorite == '1' && userUID != ''){
                sql += "join favorite f on b.UID = f.productUID "
            }
            sql += "where "
            if(badge != ''){
                sql += "a.badgeUID like ? and ";
                sqlData.push(badge);
            }
            if(mnfctUID != ''){
                sql +="a.mnfctUID like ? and "
                sqlData.push(mnfctUID);
            }
            // 해당 모델 번호 차량 사이즈 제품 호출
            sql += 'b.tireSize = ?';
            sqlData.push(width + "/" + radio + " R" + inch);
            sql += ' and b.actvt = 1 '
            if(favorite == '1' && userUID != ''){
                sql += 'and f.productUID = b.UID '
                sql += "and f.userUID = ? "
                sqlData.push(userUID);
            }
            sql += "order by a.UID desc"

            console.log(sql);
            console.log(sqlData);


            const [result] = await con.query(sql, sqlData);

            console.log(result);

            res.status(200).json({
                status : 200,
                data : groupModelBadgeList(result),
                message : "success"
            })

        } catch (err) {
            console.log("/:tireSize Error ::",err);
            throw err;
        }
    }
)

// 내 타이어와 비교하기
api.get('/comparison/:productUID',
    verifyToken,
    async function (req, res) {
        try {
            const productUID = req.params.productUID;
            const userUID = req.userUID;
            //내 대표차량 타이어 정보 가져오기
            var myCarSql = "select * from myCar where userUID = ? and `default` = 1";
            const [myCarResult] = await con.query(myCarSql, userUID)

            const tireSize = myCarResult[0].tireSize;
            const modelUID = myCarResult[0].modelUID

            var myTireSql = "select modesty, highSpeed, riding, handling, breaking, pricing from product where modelUID = ? and tireSize = ?"
            const myTireSqlData = [modelUID, tireSize];
            const [myTireReslut] = await con.query(myTireSql, myTireSqlData);

            var productSql = "select modesty, highSpeed, riding, handling, breaking, pricing from product where UID = ?"
            const [productResult] = await con.query(productSql, productUID);

            res.status(200).json({
                status: 200,
                data : {
                    "myTire" : myTireReslut[0],
                    "product" : productResult[0]
                },
                message : "success"
            })
        } catch (err) {
            throw err;
        }
    }
)

// 제품 상세보기
api.get("/:productUID",
    async function (req, res) {
        try {
            const productUID = req.params.productUID;

            var sql = "select a.UID as UID, e.imgPath, b.name as modelName, c.name as mnfctName, b.thumbnail, a.description, ifnull(contentsPath, '') as contentsPath, tireSize, modesty, highSpeed, riding, handling, breaking, pricing, price, bkmCnt, reviewCnt "
                    + "from product a "
                    + "join model b on b.UID = a.modelUID "
                    + "join mnfct c on c.UID = b.mnfctUID "
                    + "join modelBadge d on d.modelUID = b.UID "
                    + "join badge e on e.UID = d.badge "
                    + "where a.UID = ? and actvt = 1"

            const [result] = await con.query(sql, productUID);

            console.log(result);


            res.status(200).json({
                status : 200,
                data : result,
                message : "success"
            })
        } catch (err) {
            console.log("제품 상세보기 ERROR :: ", err);
            throw err;
        }
    }
)

function groupModelBadgeList(result){
    var returnData = [];
    var obj = {};
    var rowIdx = -1;

    if(result.length > 0){
        for (var i in result){
            if(result[i].UID != rowIdx){
                if(rowIdx != -1)
                    returnData.push(obj)

                obj = {};
                rowIdx = result[i].UID
                obj.UID = result[i].UID;
                obj.thumbnail = result[i].thumbnail;
                obj.mnfctName = result[i].mnfctName;
                obj.modelName = result[i].modelName;
                obj.price = result[i].price;
                obj.bkmCnt = result[i].bkmCnt;
                obj.reviewCnt = result[i].reviewCnt;
                obj.badgeImg = []
            }
            if(result[i].badgeImg != null){
                obj.badgeImg.push(result[i].badgeImg)
            }
        }
        returnData.push(obj);
    }

    return returnData;
}



module.exports = api;