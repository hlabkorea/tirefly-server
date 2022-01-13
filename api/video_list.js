const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();

// 비디오 운동 리스트 조회
api.get('/:videoUID', verifyToken, async function (req, res) {
    try{
        const videoUID = req.params.videoUID;
        var sql = "select UID as listUID, listName, listStartTime, listPlayTime, video_list.order from video_list where videoUID = ? order by video_list.order";
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


// cms - 비디오 리스트 추가
api.put('/:videoUID', verifyAdminToken, async function (req, res) {
    try{
        const adminUID = req.adminUID;
        const videoUID = req.params.videoUID;
        const videoList = req.body.videoList;

        const listUIDs = await selectVideoListUIDs(videoUID);
        if(listUIDs.length != 0) // 이미 video에 대한 리스트가 존재하면 삭제
            await deleteVideoList(listUIDs);
        
        const sqlListData = makeSqlListData(videoUID, adminUID, videoList);
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
    var sql = "select UID from video_list where videoUID = ?";
    const [result] = await con.query(sql, videoUID);
    var UIDs = [];
    if(result.length != 0){
        for(var i in result)
            UIDs.push(result[i].UID);
    }

    return UIDs;
}

// 비디오 리스트 삭제
async function deleteVideoList(listUIDs){
    var sql = "delete from video_list where UID in (?);";
    await con.query(sql, [listUIDs]);
}

// 비디오 리스트 sql data 생성
function makeSqlListData(videoUID, adminUID, videoList){
    var result = [];

    for (var i in videoList) {
        const listName = videoList[i].listName;
        const order = videoList[i].order;
        const listStartTime = videoList[i].listStartTime;
        const listPlayTime = videoList[i].listPlayTime;
        result.push([videoUID, listName, order, listStartTime, listPlayTime, adminUID]);
    }

    return result;
}

// 비디오 리스트 등록
async function insertVideoList(sqlListData){
    if(sqlListData.length != 0){
        var sql = "insert into video_list(videoUID, listName, video_list.order, listStartTime, listPlayTime, regUID) values ?;";
        await con.query(sql, [sqlListData]);
    }
}


module.exports = api;
