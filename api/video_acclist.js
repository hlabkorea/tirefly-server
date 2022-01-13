const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();

// 비디오에 대한 운동 기구 조회
api.get('/:videoUID', verifyToken, async function (req, res) {
    try{
        const videoUID = req.params.videoUID;
        var sql = "select b.UID, b.accName, b.rectImgPath as imgPath " +
            "from video_acclist a " +
            "join acc b on a.accUID = b.UID " +
            "where a.videoUID = ?";
        const [result] = await con.query(sql, videoUID);

        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// cms - 비디오에 대한 운동 기구 추가
api.put('/:videoUID', verifyAdminToken, async function (req, res) {
    try{
        const adminUID = req.adminUID;
        const videoUID = req.params.videoUID;
        const accList = req.body.acc;

        const listUIDs = await selectVideoListUIDs(videoUID);
        if(listUIDs.length != 0) // 이미 video에 대한 운동 기구들이 존재하면 삭제
            await deleteVideoList(listUIDs);

        const sqlListData = makeSqlListData(videoUID, adminUID, accList);
        await insertVideoList(sqlListData);

        res.status(200).send({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 비디오 리스트 UID 조회
async function selectVideoListUIDs(videoUID){
    var sql = "select UID from video_acclist where videoUID = ?";
    const [result] = await con.query(sql, videoUID);
    var UIDs = [];
    if(result.length != 0){
        for(var i in result)
            UIDs.push(result[i].UID);
    }

    return UIDs;
}

// 비디오 운동 기구 삭제
async function deleteVideoList(listUIDs){
    var sql = "delete from video_acclist where UID in (?);";
    await con.query(sql, [listUIDs]);
}

// 비디오 운동 기구 sql data 생성
function makeSqlListData(videoUID, adminUID, accList){
    var result = [];

    for (var i in accList) {
        result.push([videoUID, accList[i], adminUID]);
    }

    return result;
}

// 비디오 운동 기구 등록
async function insertVideoList(sqlListData) {
    if (sqlListData.length != 0) {
        var sql = "insert into video_acclist(videoUID, accUID, regUID) values ?;";
        await con.query(sql, [sqlListData]);
    }
}


module.exports = api;
