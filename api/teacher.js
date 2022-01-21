const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const { getPageInfo } = require('./config/paging.js'); 
const api = express.Router();
const pageCnt15 = 15;

// 강사 목록 조회
api.get('/', verifyToken, async function (req, res) {
    try{
        var sql = "select UID as teacherUID, teacherImg, teacherName, teacherNickName, teacherGender, regDate,status from teacher where UID >= 1 ";
        const searchType = req.query.searchType ? req.query.searchType : '';
        const searchWord = req.query.searchWord ? req.query.searchWord : '';
        const status = req.query.status ? req.query.status : 'act';
        var currentPage = req.query.page ? parseInt(req.query.page) : '';

        if (status != "all") { // 상태값에 따라 조회
            sql += `and status = '${status}' `;
        }

        if (searchType.length != 0){ // 검색
            if (searchType == "teacherName")
                sql += "and teacherName ";
            else if (searchType == "teacherNick")
                sql += "and teacherNickname ";

            sql += `LIKE '%${searchWord}%' `;
        }

        sql += "order by UID desc ";

        if (currentPage.length != 0) { // 페이징으로 조회
            var countSql = sql + ";";
            const offset = parseInt(currentPage - 1) * pageCnt15;
            sql += `limit ${offset}, ${pageCnt15}`;

            const [result] = await con.query(countSql + sql);
            const {
                startPage,
                endPage,
                totalPage
            } = getPageInfo(currentPage, result[0].length, pageCnt15);

            res.status(200).json({
                status: 200,
                data: {
                    paging: {
                        startPage: startPage,
                        endPage: endPage,
                        totalPage: totalPage
                    },
                    result: result[1]
                },
                message: "success"
            });
        } else { // 전체 조회
            const [result] = await con.query(sql);

            res.status(200).json({
                status: 200,
                data: result,
                message: "success"
            });
        }
    } catch (err) {
        throw err;
    }
});

// 강사 수 조회
api.get('/count', verifyAdminToken, async function (req, res) {
    try{
        var sql = "select count(*) as cnt from teacher where status = 'act'";
        const [result] = await con.query(sql);
        res.status(200).send({
            status: 200,
            data: result[0].cnt,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 강사 정보 조회
api.get('/:teacherUID', verifyToken, async function (req, res) {
    try{
        const teacherUID = req.params.teacherUID;
        var sql = "select UID, teacherImg, teacherName, teacherNickName, teacherGender, teacherIntroduce, teacherCareer, teacherInstagram, teacherYoutube, status " +
            "from teacher " +
            "where UID = ?";
        const [result] = await con.query(sql, teacherUID);

        res.status(200).json({
            status: 200,
            data: result[0],
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// cms - 강사 추가
api.post('/', verifyAdminToken, async function (req, res) {
    try{
        const adminUID = req.adminUID;
        const tcName = req.body.tcName;
        const tcNick = req.body.tcNick;
        const tcGender = req.body.tcGender;
        const tcCareer = req.body.tcCareer;
        const tcInfo = req.body.tcInfo;
        const tcInsta = req.body.tcInsta;
        const tcYoutube = req.body.tcYoutube;
        const status = req.body.status;
        var sql = "insert teacher(teacherName, teacherNickName, teacherGender, teacherCareer, teacherIntroduce, teacherInstagram, teacherYoutube, status, regUID) values (?)";
        const sqlData = [tcName, tcNick, tcGender, tcCareer, tcInfo, tcInsta, tcYoutube, status, adminUID];
        const [result] = await con.query(sql, [sqlData]);

        res.status(200).json({
            status: 200,
            data: {
                teacherUID: result.insertId
            },
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// cms - 강사 활성화 여부 수정
api.put('/status/:teacherUID', verifyAdminToken, async function (req, res) {
    try{
        const teacherUID = req.params.teacherUID;
        const status = req.body.status;
        var sql = "update teacher set status = ? where UID = ?";
        const sqlData = [status, teacherUID];

        await con.query(sql, sqlData);

        res.status(200).send({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// cms - 강사 이미지 업로드
api.put('/image/:teacherUID',
    verifyAdminToken,
    upload.single("img"),
    async function (req, res) {
        try{
            const teacherUID = req.params.teacherUID;
            const filename = req.file.filename;
            var sql = "update teacher set teacherImg = ? where UID = ?";
            const sqlData = [filename, teacherUID];
            await con.query(sql, sqlData);
            res.status(200).json({
                status: 200,
                data: {
                    filename: filename
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// cms - 강사 정보 수정
api.put('/:teacherUID', verifyAdminToken, async function (req, res) {
    try{
        const adminUID = req.adminUID;
        const teacherUID = req.params.teacherUID;
        const tcName = req.body.tcName;
        const tcNick = req.body.tcNick;
        const tcGender = req.body.tcGender;
        const tcCareer = req.body.tcCareer;
        const tcInfo = req.body.tcInfo;
        const tcInsta = req.body.tcInsta;
        const tcYoutube = req.body.tcYoutube;
        const status = req.body.status;
        var sql = "update teacher set teacherName = ?, teacherNickName = ?, teacherGender = ?, teacherCareer = ?, teacherIntroduce = ?, teacherInstagram = ?, teacherYoutube = ?, updateUID = ?, teacher.status = ? " +
            "where UID = ?";
        const sqlData = [tcName, tcNick, tcGender, tcCareer, tcInfo, tcInsta, tcYoutube, adminUID, status, teacherUID];
        await con.query(sql, sqlData);

        res.status(200).json({
            status: 200,
            data: "success",
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

module.exports = api;
