const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const { visionUpload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

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
                const [rows] = await con.query(sql, [sqlData]);

                res.status(200).json({
                    status: 200,
                    data: {
                        visionUID: rows.insertId,
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