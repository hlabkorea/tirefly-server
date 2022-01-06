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
        var type = req.query.type ? req.query.type : ''; 
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
    var accUID = req.params.accUID;
    var sql = `select accName, imgPath, actImgPath, rectImgPath, status from acc where UID = ${accUID}`;
    const [result] = await con.query(sql);
    res.status(200).json({
        status: 200,
        data: result,
        message: "success"
    });
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
                    var accName = req.body.accName;
                    var adminUID = req.adminUID;
                    var status = req.body.status;
                    var sql = `insert acc(accName, regUID, status) values('${accName}', ${adminUID}, '${status}')`;
                    const [rows, fields] = await con.query(sql);
                    res.status(200).json({
                        status: 200,
                        data: {
                            accUID: rows.insertId
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
                    var accUID = req.params.accUID;
                    var filename = req.file.filename;
                    var imgType = req.body.imgType;
                    const query = `update acc set ${imgType} = '${filename}' where UID = ${accUID}`;
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
                    var accUID = req.params.accUID;
                    var status = req.body.status;
                    const query = `update acc set status = '${status}' where UID = ${accUID}`;
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
                    var accUID = req.params.accUID;
                    var accName = req.body.accName;
                    var status = req.body.status;
                    var adminUID = req.adminUID;
                    const query = `update acc set accName = '${accName}', status = '${status}', updateUID = ${adminUID} where UID = ${accUID}`;
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

// mysql2 버전
/*
const { con2 } = require('./config/database');

// create
try{
    const query = 'insert acc(accName, status) values("테스트2", "inact")';
    const [rows, fields] = await con.query(query);
    res.status(200).json({
        status: 200,
        data: {
            accUID: rows.insertId
        },
        message: "success"
    });
} catch (err) {
    throw err;
}

// read
try{
    const query = 'select UID, accName, imgPath, actImgPath, rectImgPath, status from acc';
    const [result] = await con.query(query);
    res.status(200).json({
        status: 200,
        data: result,
        message: "success"
    });
} catch (err) {
    throw err;
}

// update
try{
    const query = `update acc set accName = '수정테스트' where UID = 18`;
    const [rows, fields] = await con.query(query);
    res.status(200).json({
        status: 200,
        data: "true",
        message: "success"
    });
} catch (err) {
    throw err;
}

// delete
try{
    const query = 'delete from acc where UID = 20';
    const [rows, fields] = await con.query(query);
    res.status(200).json({
        status: 200,
        data: "true",
        message: "success"
    });
} catch (err) {
    throw err;
}

*/ 

module.exports = api;