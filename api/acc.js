const express = require('express');
const { con } = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 악세사리 조회
api.get('/', async function (req, res) {
    try{
        const type = req.query.type ? req.query.type : ''; 
        var sql = "select UID, accName, imgPath, actImgPath, rectImgPath, status from acc ";
        if (type != "cms") // 운동기구의 활성화 상태에 상관없이 모두 조회할 대는 type을 cms로 보낸다
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

// cms - 악세사리 상세조회
api.get('/:accUID', async function (req, res) {
    try{
        const accUID = req.params.accUID;
        var sql = `select accName, imgPath, actImgPath, rectImgPath, status from acc where UID = ${accUID}`;
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

// cms - 악세사리 등록
api.post('/', 
        verifyAdminToken,
        [
            check("accName", "accName is required").not().isEmpty(),
            check("status", "status is required").not().isEmpty()
        ], 
        async function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const accName = req.body.accName;
                    const adminUID = req.adminUID;
                    const status = req.body.status;
                    var sql = `insert acc(accName, regUID, status) values('${accName}', ${adminUID}, '${status}')`;
                    const [rows] = await con.query(sql);
                    res.status(200).json({
                        status: 200,
                        data: {
                            accUID: rows.insertId // 생성된 auto increment id
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
api.put('/image/:accUID',
        verifyAdminToken,
        upload.single("img"),
        async function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const accUID = req.params.accUID;
                    const filename = req.file.filename;
                    const imgType = req.body.imgType;
                    const query = `update acc set ${imgType} = '${filename}' where UID = ${accUID}`;
                    // const query = "update acc set " + imgType = " where UID = ?"; // imgType은 칼럼명인데, prepared statement(? 형식)를 사용하게 되면 string 으로 들어가서, 이렇게 해주어야 한다
                    await con.query(query);
                    res.status(200).json({
                        status: 200,
                        data: { filename: filename },
                        message: "success"
                    });
                } catch (err) {
                    throw err;
                }
            }
        }
);

// cms - 악세사리 활성화 여부 수정
api.put('/status/:accUID', 
        verifyAdminToken, 
        [
            check("status", "status is required").not().isEmpty()
        ],
        async function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const accUID = req.params.accUID;
                    const status = req.body.status;
                    var query = `update acc set status = '${status}' where UID = ${accUID}`;
                    await con.query(query);
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

// cms - 악세사리 수정
api.put('/:accUID', 
        verifyAdminToken, 
        async function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const accUID = req.params.accUID;
                    const accName = req.body.accName;
                    const status = req.body.status;
                    const adminUID = req.adminUID;
                    var query = `update acc set accName = '${accName}', status = '${status}', updateUID = ${adminUID} where UID = ${accUID}`;
                    await con.query(query);
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

module.exports = api;