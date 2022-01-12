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
			if(errors.isEmpty()){
                try{
                    const filename = req.file.filename;
                    var sql = "insert vision(filePath, status) values (?, '검사')";
                    await con.query(sql, filename);
                    
                    res.status(200).json({
                        status: 200,
                        data: {filename: filename},
                        message: "success"
                    });
                } catch (err) {
                    throw err;
                }
            }
        }
);

module.exports = api;