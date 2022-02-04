const express = require('express');
const { con } = require('./config/database.js');
const path = require('path');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { onlyUpload } = require('./config/uploadFile.js');
const fs = require('fs');
const md5File = require('md5-file');
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// QT 버전 목록 조회
api.get('/', verifyAdminToken, async function (req, res) {
    try{
        var sql = "select UID as qtUID, version, memo, regDate from qt_version order by regDate desc";
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

// QT 버전 등록
api.post('/', verifyAdminToken, onlyUpload.single("qt_file"), async function (req, res) {
    try{
        const version = req.body.version;
        const memo = req.body.memo;
        var sql = "insert qt_version(version, memo) values (?)";
        const sqlData = [version, memo];
        await con.query(sql, [sqlData]);

        res.status(200).json({status:200, data:"true", message: "success"});
    } catch (err) {
        throw err;
    }
});

// 버전 체크
api.post('/check', 
		verifyToken, 
		[
			check("version", "version is required").not().isEmpty()
		],
		async function (req, res) {
			const errors = getError(req, res);
			
			if(errors.isEmpty()){
                try{
                    const userQtVer = req.body.version;
                    var sql = "select version from qt_version order by regDate desc limit 1";
                    const [result] = await con.query(sql);
                    const qtVer = result[0].vision
                    if(qtVer == userQtVer){
                        res.status(200).json({
							status: 200,
							data: "true",
							message: "success"
						});
                    }
                    else{
                        const hash = md5File.sync(path.join('/', 'usr', 'share', 'nginx', 'motif-server', 'views', 'files', 'motif.tar.gz'));
						res.status(200).json({
							status: 200,
							data: {
								version: qtVer,
								filename: hash,
								fileURL: "https://api.motifme.io/files/motif.tar.gz"
							},
							message: "success"
						});
                    }
                } catch (err) {
                    throw err;
                }
			}
		}
);

// 파일 업로드 테스트
api.post('/test', onlyUpload.single("motif_file"), async function (req, res) {
    try{
        const version = req.body.version;
        var sql = "insert qt_version(version) values (?)";
        await con.query(sql, version);
    
        res.status(200).json({status:200, data:"true", message: "motif.tar.gz 파일 업로드가 완료되었습니다."});
    } catch (err) {
        throw err;
    }
});

// 테스트 - QT 버전 목록 조회 -> qt_test.html 에서 사용
api.get('/test', async function (req, res) {
    try{
        var sql = "select UID, version, regDate from qt_version order by regDate desc";
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

// 테스트 - motif.tar.gz 파일 존재 확인 -> qt_test.html 에서 사용
api.get('/test/exist', async function (req, res) {
    const filePath = '../motif-server/views/files/motif.tar.gz';

    fs.exists(filePath, function (exists) {
        if(exists){							
            res.status(200).json({status:200, data:"true", message: "motif.tar.gz 파일이 존재합니다."});
        }
        else{
            res.status(403).json({status:403, data:"false", message: "motif.tar.gz 파일이 존재하지 않습니다."});
        }
    });
});

// 테스트 - motif.tar.gz 파일 삭제 -> qt_test.html 에서 사용
api.delete('/test', function (req, res) {
    const filePath = '../motif-server/views/files/motif.tar.gz';

    // 파일이 존재하면 삭제
    fs.exists(filePath, function (exists) {
        if(exists){							
            fs.unlink(filePath, function (err) {
                if (err) throw err;

                res.status(200).json({status:200, data:"true", message: "motif.tar.gz 파일이 삭제되었습니다."});
            });
        }
        else{
            res.status(403).json({status:403, data:"false", message: "motif.tar.gz 파일이 존재하지 않습니다."});
        }
    });
});

// 테스트 - 특정 버전 삭제 -> qt_test.html 에서 사용
api.delete('/test/:versionUID', async function (req, res) {
    try{
        const versionUID = req.params.versionUID;
        var sql = "delete from qt_version where UID = ?";

        await con.query(sql, versionUID);
    } catch (err) {
        throw err;
    }
});

module.exports = api;