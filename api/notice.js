const express = require('express');
const { con } = require('./config/database.js');
const { getPageInfo } = require('./config/paging.js'); 
const { verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const pageCnt10 = 10;


// 전체 공지사항 조회
api.get('/', async function (req, res) {
    try {
        var sql = "select UID as UID, title, regDate from notice order by regDate desc, UID desc"

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

// 메인화면 공지사항 조회
api.get('/main', async function (req, res) {
    try {
        var sql = "select UID as UID, title, regDate from notice order by regDate desc, UID desc limit 1"

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



// 공지사항 상세정보 조회
api.get("/:noticeUID", async function (req, res) {
    try {
        const noticeUID = req.params.noticeUID;
        var sql = "select title, contents, regDate from notice where UID = ?";
        const [result] = await con.query(sql, noticeUID);

        console.log(result);

        res.status(200).json({status:200, data: result, message:"success"});
    } catch (err) {
        throw err;
    }
})

module.exports = api;