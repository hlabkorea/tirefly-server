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
                    const visionUID = req.body.visionUID? req.body.visionUID : 0;
                    const filename = req.file.filename;

                    if(visionUID == 0){
                        var sql = "insert vision(objFilePath, status) values (?, '검사')";
                        await con.query(sql, filename);
                        
                        res.status(200).json({
                            status: 200,
                            data: {filename: filename},
                            message: "success"
                        });
                    }
                    else{
                        var sql = "update vision set txtFilePath = ? where UID = ?";
                        const sqlData = [filename, visionUID];
                        await con.query(sql, sqlData);
                        res.status(200).json({
                            status: 200,
                            data: "success",
                            message: "success"
                        });
                    }
                } catch (err) {
                    throw err;
                }
            }
        }
);

module.exports = api;