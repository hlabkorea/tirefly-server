const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const fs = require('fs');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// cms - bgm 전체 조회
api.get('/', verifyAdminToken, async function (req, res) {
    try{
        var sql = "select a.UID as musicUID, b.UID as categoryUID, b.categoryName, a.musicName, a.artist, a.musicPath "
                + "from music a "
                + "join category b on a.categoryUID = b.UID "
                + "order by a.categoryUID, a.UID";
        const [result] = await con.query(sql);

        res.status(200).json({status:200, data: result, message:"success"});
    } catch (err) {
        throw err;
    }
});

// 카테고리에 해당하는 bgm 랜덤 조회
api.get('/:categoryUID', verifyToken, async function (req, res) {
    try{
        const categoryUID = req.params.categoryUID;
        var sql = "select UID as musicUID, musicName, artist, musicPath from music where categoryUID = ? order by rand()";
        const [result] = await con.query(sql, categoryUID);

        res.status(200).json({status:200, data: result, message:"success"});
    } catch (err) {
        throw err;
    }
});

// cms - 카테고리에 해당하는 bgm 추가
api.post('/', 
        verifyAdminToken, 
        [
            check("categoryUID", "categoryUID is required").not().isEmpty(),
            check("musicPath", "musicPath is required").not().isEmpty(),
            check("musicName", "musicName is required").not(),
            check("artist", "artist is required").not().isEmpty()
        ],
        async function (req, res) {
            const errors = getError(req, res);
		    if(errors.isEmpty()){
                try{
                    const adminUID = req.adminUID;
                    const categoryUID = req.body.categoryUID;
                    const musicPath = req.body.musicPath;
                    const musicName = req.body.musicName;
                    const artist = req.body.artist;
                    var sql = "insert music(categoryUID, musicPath, musicName, artist, regUID) values (?)";
                    const sqlData = [categoryUID, musicPath, musicName, artist, adminUID];
                    const [result] = await con.query(sql, [sqlData]);

                    res.status(200).json({status:200, data: {musicUID: result.insertId}, message: "success"});
                } catch (err) {
                    throw err;
                }
            }
        }
);

// cms - bgm 파일 업로드
// 파일을 tencent cloud에 올리면서 코드 주석 처리
/*api.put('/file/:musicUID', 
		verifyAdminToken,
		upload.single("file"), 
		async function (req, res) {
            try{
                const musicUID = req.params.musicUID;
                const filename = req.file.filename;
                var sql = "update music set musicPath = ? where UID = ?";
                const sqlData = [filename, musicUID];
                await con.query(sql, sqlData);
                res.status(200).json({status:200, data:{filename: filename}, message: "success"});
            } catch (err) {
                throw err;
            }
		}
);*/

// cms - bgm 삭제
api.delete('/:musicUID', verifyAdminToken, async function (req, res) {
    try{
        const musicUID = req.params.musicUID;
        // 파일을 tencent cloud에 올리면서 코드 주석 처리
        /*const filename = await selectMusicPath(musicUID);
        deleteMusicFile(filename);*/
        await deleteMusic(musicUID);

        res.status(200).json({status:200, data: "true", message:"success"});
    } catch (err) {
        throw err;
    }
});

// bgm 파일명 조회
async function selectMusicPath(musicUID){
    var sql = "select musicPath from music where UID = ?";
    const [result] = await con.query(sql, musicUID);

    if(result.length != 0)
        return result[0].musicPath;
    else
        return '';
}

// bgm 파일 삭제
function deleteMusicFile(filename){
    if(filename.length != 0){
        const filePath = '../motif-server/views/files/';

        // 파일이 존재하면 삭제
        fs.exists(filePath + filename, function (exists) {
            if(exists){							
                fs.unlink(filePath + filename, function (err) {
                    if (err) throw err;
                });
            }
        });
    }
   
}

// bgm 삭제
async function deleteMusic(musicUID){
    var sql = "delete from music where UID = ?";
    await con.query(sql, musicUID);
}

module.exports = api;
