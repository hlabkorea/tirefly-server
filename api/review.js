const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');



//메인 화면 리뷰 조회
api.get('/main', async function (req, res) {
    try {
        //차량정보 등록 로직 완료시 email 을 차량명으로 변경 예정
        var sql = "select a.UID as UID, review, b.email, d.name "
                + "from review a "
                + "join user b on a.userUID = b.UID "
                + "join product c on c.UID = a.productUID "
                + "join model d on d.UID = c.modelUID "
                + "order by a.regDate desc, a.UID desc limit 3"
                
        const [result] = await con.query(sql);

        res.status(200).json({
            status : 200,
            data : result,
            message : "success"
        })

    } catch (err) {
        console.log("에러 좀 보자 : ", err)
        throw err;
    }
});

// 전체 리뷰 조회
api.get('/:productUID', async function (req, res) {
    try {
        const productUID = Number(req.params.productUID)
        //차량정보 등록 로직 완료시 email 을 차량명으로 변경 예정
        var sql = "select a.UID as UID, review, b.email, d.name "
                + "from review a "
                + "join user b on a.userUID = b.UID "
                + "join product c on c.UID = a.productUID "
                + "join model d on d.UID = c.modelUID "
                + "where a.productUID = ? "
                + "order by a.regDate desc, a.UID desc"
        const [result] = await con.query(sql, productUID);

        res.status(200).json({
            status : 200,
            data : result,
            message : "success"
        })

    } catch (err) {
        console.log("에러 좀 보자 : ", err)
        throw err;
    }
});

// 공지사항 상세정보 조회
api.get("/:reviewUID", async function (req, res) {
    try {
        const reviewUID = req.params.reviewUID;
        var sql = "select a.modesty, a.highSpeed, a.handling, a.riding, a.braking, a.pricing, a.tirePath, a.carPath, review, b.email, d.name "
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