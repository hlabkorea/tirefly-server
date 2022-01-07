const express = require('express');
const { con } = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 카테고리 조회
api.get('/', async function (req, res) {
    try{
        const type = req.query.type ? req.query.type : ''; 
        var sql = "select UID, categoryName, categoryImg, status from category ";
        if (type != "cms") // 카테고리의 활성화 상태에 상관없이 모두 조회할 대는 type을 cms로 보낸다
            sql += "where status = 'act'";
        const [result] = await con.query(sql);
        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// cms - 카테고리 상세조회
api.get('/:categoryUID', async function (req, res) {
    try{
        const categoryUID = req.params.categoryUID;
        var sql = "select categoryName, categoryImg, status, calorie1, calorie2, calorie3 from category where UID = ?";
        const [result] = await con.query(sql, categoryUID);
        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// cms - 카테고리 등록
api.post('/',
    verifyAdminToken,
    [
        check("categoryName", "categoryName is required").not().isEmpty(),
        check("status", "status is required").not().isEmpty(),
        check("calorie1", "calorie1 is required").not().isEmpty(),
        check("calorie2", "calorie2 is required").not().isEmpty(),
        check("calorie3", "calorie3 is required").not().isEmpty()
    ], 
    async function (req, res) {
        const errors = getError(req, res);
		if(errors.isEmpty()){
            try{
                const categoryName = req.body.categoryName;
                const adminUID = req.adminUID;
                const status = req.body.status;
                const calorie1 = req.body.calorie1;
                const calorie2 = req.body.calorie2;
                const calorie3 = req.body.calorie3;
                var sql = "insert category(categoryName, regUID, status, calorie1, calorie2, calorie3) values(?)";
                const data = [categoryName, adminUID, status, calorie1, calorie2, calorie3];
                const [rows] = await con.query(sql, [data]);
                res.status(200).json({
                    status: 200,
                    data: {
                        categoryUID: rows.insertId // 생성된 auto increment id
                    },
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// cms - 악세사리 이미지 업로드
api.put('/image/:categoryUID',
    verifyAdminToken,
    upload.single("img"),
    async function (req, res) {
        try{
            const categoryUID = req.params.categoryUID;
            const filename = req.file.filename;
            var sql = "update category set categoryImg = ? where UID = ?";
            const data = [filename, categoryUID];
            await con.query(sql, data);
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

// cms - 카테고리 활성화 여부 수정
api.put('/status/:categoryUID',
    verifyAdminToken,
    [
        check("status", "status is required").not().isEmpty()
    ], 
    async function (req, res) {
        const errors = getError(req, res);
		if(errors.isEmpty()){
            try{
                const categoryUID = req.params.categoryUID;
                const status = req.body.status;
                var sql = "update category set status = ? where UID = ?";
                const data = [status, categoryUID];
                await con.query(sql, data);
                res.status(200).send({
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

// cms - 카테고리 수정
api.put('/:categoryUID',
    verifyAdminToken,
    [
        check("categoryName", "categoryName is required").not().isEmpty(),
        check("status", "status is required").not().isEmpty(),
        check("calorie1", "calorie1 is required").not().isEmpty(),
        check("calorie2", "calorie2 is required").not().isEmpty(),
        check("calorie3", "calorie3 is required").not().isEmpty()
    ], 
    async function (req, res) {
        const errors = getError(req, res);
		if(errors.isEmpty()){
            try{
                const categoryUID = req.params.categoryUID;
                const categoryName = req.body.categoryName;
                const status = req.body.status;
                const adminUID = req.adminUID;
                const calorie1 = req.body.calorie1;
                const calorie2 = req.body.calorie2;
                const calorie3 = req.body.calorie3;
                var sql = "update category set categoryName = ?, status = ?, calorie1 = ?, calorie2 = ?, calorie3 = ?, updateUID = ? where UID = ?";
                const data = [categoryName, status, calorie1, calorie2, calorie3, adminUID, categoryUID];
                await con.query(sql, data);
                res.status(200).send({
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

module.exports = api;
