const express = require('express');
const { con } = require('./config/database.js');
const { getPageInfo } = require('./config/paging.js'); 
const { verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const pageCnt10 = 10;

// 이벤트 전체 조회
api.get('/', async function (req, res) {
    try {
        var sql = "select UID as UID, title, regDate, endDate, imgPath, color from event order by regDate desc, UID desc"

        const [result] = await con.query(sql);

        res.status(200).json({
            status : 200,
            data : result,
            message : "success"
        })

    } catch (err) {
        throw err;
    }
});

// 이벤트 조회
api.get('/main', async function (req, res) {
    try {
        var sql = "select UID as UID, title, endDate, imgPath, color from event where endDate > now() order by regDate desc, UID desc limit 3"

        const [result] = await con.query(sql);

        res.status(200).json({
            status : 200,
            data : result,
            message : "success"
        })

    } catch (err) {
        throw err;
    }
});



// 이벤트 상세정보 조회
api.get("/:eventUID", async function (req, res) {
    try {
        const eventUID = req.params.eventUID;
        var sql = "select title, contents, color, imgPath, ifnull(linkUrl, '') as linkUrl, regDate, endDate from event where UID = ?";
        const [result] = await con.query(sql, eventUID);

        console.log(result);

        res.status(200).json({status:200, data: result, message:"success"});
    } catch (err) {
        throw err;
    }
})


module.exports = api;