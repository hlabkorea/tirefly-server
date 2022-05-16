const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { getPageInfo } = require('./config/paging.js'); 
const pageCnt30 = 30;



//메인 화면 리뷰 조회
api.get('/main', async function (req, res) {
    try {
        const onlyPhoto = req.query.onlyPhoto;


        //차량정보 등록 로직 완료시 email 을 차량명으로 변경 예정
        var sql = "select a.UID as UID, review, ifnull(c.thumbnail, '') as thumbnail, b.email, d.name "
                + "from review a "
                + "join user b on a.userUID = b.UID "
                + "join product c on c.UID = a.productUID "
                + "join model d on d.UID = c.modelUID "
                + "order by a.regDate desc, a.UID desc limit 3"

        if ( onlyPhoto == '1'){
            sql += '';
        }
                
        const [result] = await con.query(sql);

        res.status(200).json({
            status : 200,
            data : result,
            message : "success"
        })


    } catch (err) {
        console.log("error from /review/main :: ", err)
        throw err;
    }
});

// 전체 리뷰 조회
api.get('/product/:productUID', async function (req, res) {
    try {
        const currentPage = req.query.page ? parseInt(req.query.page) : 1;
        const onlyPhoto = req.query.photo ? req.query.photo : '';
        const offset = parseInt(currentPage - 1) * pageCnt30;
        const productUID = Number(req.params.productUID)
        //차량정보 등록 로직 완료시 email 을 차량명으로 변경 예정
        var sql = "select a.UID as UID, review, b.email, d.name "
                + "from review a "
                + "join user b on a.userUID = b.UID "
                + "join product c on c.UID = a.productUID "
                + "join model d on d.UID = c.modelUID "
                + "where a.productUID = " + `${productUID} `;
        var countSQL = sql + ";";
        sql += "order by a.regDate desc, a.UID desc " + `limit ${offset}, ${pageCnt30}`;
        const [result] = await con.query(countSQL+sql);

        var {
            startPage, endPage, totalPage
        } = getPageInfo(currentPage, result[0].length, pageCnt30);

        res.status(200).json({
            status : 200,
            data : {
                paging : {
                    startPage : startPage,
                    endPage : endPage,
                    totalPage : totalPage,
                },
                result : result[1]
            },
            message : "success"
        })

    } catch (err) {
        console.log("에러 좀 보자 : ", err)
        throw err;
    }
});

// 리뷰 상세정보 조회
api.get("/:reviewUID", async function (req, res) {
    try {
        const reviewUID = req.params.reviewUID;
        var sql = "select a.modesty, a.highSpeed, a.handling, a.riding, a.braking, a.pricing, ifnull(a.tirePath, '') as tirePath, ifnull(a.carPath, '') as carPath, review, b.email, d.name "
                + "from review a join user b on b.UID = a.userUID join product c on c.UID = a.productUID join model d on d.UID = c.modelUID "
                + "where a.UID = ?"
        const [result] = await con.query(sql, reviewUID);

        console.log(result);

        res.status(200).json({status:200, data: result, message:"success"});
    } catch (err) {
        throw err;
    }
})


module.exports = api;