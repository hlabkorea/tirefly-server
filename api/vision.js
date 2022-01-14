const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const { visionUpload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

api.get('/', async function (req, res) {
    var sql = "select * from vision order by regDate desc limit 1";
    const [result] = await con.query(sql);
    res.status(200).json({
        status: 200,
        data: result[0],
        message: "success"
    });
});

// vision obj 파일 업로드
api.post('/',
    visionUpload.single("vision_file"),
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const filename = req.file.filename;
                const shoulder = req.body.shoulder;
                const waist = req.body.waist;
                const hip = req.body.hip;
                const thigh = req.body.thigh;
                const calf = req.body.calf;
                const status = '검사';

                var sql = "insert vision(filePath, shoulder, waist, hip, thigh, calf, status) values (?)";
                const sqlData = [filename, shoulder, waist, hip, thigh, calf, status];
                const [result] = await con.query(sql, [sqlData]);

                res.status(200).json({
                    status: 200,
                    data: {
                        visionUID: result.insertId,
                        filename: filename
                    },
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

module.exports = api;