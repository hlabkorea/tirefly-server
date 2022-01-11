const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 메인 슬라이드(배너) 조회
api.get('/', verifyToken, async function (req, res) {
    try{
        var sql = "select UID as slideUID, imgPath, type, url, page, args, updateDate from main_slide";
        const [result] = await con.query(sql);
        res.status(200).json({status:200, data: result, message:"success"});
    } catch (err) {
        throw err;
    }	
});

// cms - 메인 슬라이드(배너) 상세조회
api.get('/:slideUID', verifyAdminToken, async function (req, res) {
    try{
        const slideUID = req.params.slideUID;
        var sql = "select imgPath, type, url, page, args from main_slide where UID = ?";
        const [result] = await con.query(sql, slideUID);
        res.status(200).json({status:200, data: result, message:"success"});	
    } catch (err) {
        throw err;
    }
});

// cms - 메인 슬라이드(배너) 생성
api.post('/',
    verifyAdminToken,
    [
        check("type", "type is required").not().isEmpty(),
        check("url", "url is required").not().isEmpty(),
        check("page", "page is required").not(),
        check("args", "args is required").not().isEmpty()
    ], 
    async function (req, res) {
        const errors = getError(req, res);
		if(errors.isEmpty()){
            try{
                const adminUID = req.adminUID;
                const type = req.body.type;
                const url = req.body.url;
                const page = req.body.page;
                const args = req.body.args;
                var sql = "insert main_slide(type, url, page, args, regUID) values (?)";
                const sqlData = [type, url, page, args, adminUID];
                const [rows] = await con.query(sql, [sqlData]);

                res.status(200).json({
                    status: 200,
                    data: {
                        slideUID: rows.insertId // 생성된 auto increment id
                    },
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// cms - 메인 슬라이드(배너) 이미지 업로드
api.put('/image/:slideUID', 
		verifyAdminToken,
		upload.single("img"), 
		async function (req, res) {
            try{
                var slideUID = req.params.slideUID;
                const filename = req.file.filename;
                var sql = "update main_slide set imgPath = ? where UID = ?";
                const sqlData = [filename, slideUID];
                await con.query(sql, sqlData);

                res.status(200).json({status:200, data:{filename: filename}, message: "success"});
            } catch (err) {
                throw err;
            }
		}
);

// cms - 메인 슬라이드(배너) 수정
api.put('/:slideUID',
    verifyAdminToken,
    [
        check("type", "type is required").not().isEmpty(),
        check("url", "url is required").not().isEmpty(),
        check("page", "page is required").not().isEmpty(),
        check("args", "args is required").not().isEmpty()
    ], 
    async function (req, res) {
        const errors = getError(req, res);
		if(errors.isEmpty()){
            try{
                const adminUID = req.adminUID;
                const slideUID = req.params.slideUID;
                const type = req.body.type;
                const url = req.body.url;
                const page = req.body.page;
                const args = req.body.args;
                var sql = "update main_slide set type = ?, url = ?, page = ?, args = ?, updateUID = ? where UID = ?";
                const sqlData = [type, url, page, args, adminUID, slideUID];
                await con.query(sql, sqlData);

                res.status(200).json({
                    status: 200,
                    data: "true",
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// cms - 메인 슬라이드(배너) 삭제
api.delete('/:slideUID', verifyAdminToken, async function (req, res) {
    try{
        const slideUID = req.params.slideUID;
        var sql = "delete from main_slide where UID = ?";
        await con.query(sql, slideUID);
        res.status(200).json({status:200, data: "true", message:"success"});
    } catch (err) {
        throw err;
    }
});

module.exports = api;