const express = require('express');
const { con } = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { getPageInfo } = require('./config/paging.js'); 
const { upload } = require('./config/uploadFile.js');
var querystring = require("querystring");
var crypto = require('crypto');
const pageCnt15 = 15;

// cms - vod 전체 조회
api.get('/', verifyAdminToken, async function (req, res) {
    try{
        const searchType = req.query.searchType ? req.query.searchType : '';
        const searchWord = req.query.searchWord ? req.query.searchWord : '';
        const status = req.query.status ? req.query.status : 'act';
        const currentPage = req.query.page ? parseInt(req.query.page) : '';

        var sql = "select a.UID as videoUID, a.videoThumbnail, a.videoName, c.categoryName, b.teacherName, a.videoLevel, a.regDate, a.status, a.categoryUID " +
            "from video a " +
            "join teacher b on a.teacherUID = b.UID " +
            "join category c ON a.categoryUID = c.UID " +
            "where a.videoType = 'vod' ";

        if (searchType.length != 0){
            if (searchType == "videoName") 
                sql += "and a.videoName ";
            else if (searchType == "teacherName")
                sql += "and b.teacherName ";

            sql += `LIKE '%${searchWord}%' `;
        }

        if (status != "all") 
            sql += `and a.status = '${status}' `;

        sql += "order by a.UID desc ";

        if (currentPage != '') {
            var countSql = sql + ";";
            const offset = parseInt(currentPage - 1) * pageCnt15;
            sql += `limit ${offset}, ${pageCnt15}`;

            const [result] = await con.query(countSql + sql);
            const {
                startPage,
                endPage,
                totalPage
            } = getPageInfo(currentPage, result[0].length, pageCnt15);

            res.status(200).json({
                status: 200,
                data: {
                    paging: {
                        startPage: startPage,
                        endPage: endPage,
                        totalPage: totalPage
                    },
                    result: result[1]
                },
                message: "success"
            });
        } else {
            const [result] = await con.query(sql);

            res.status(200).json({
                status: 200,
                data: result,
                message: "success"
            });
        }
    } catch (err) {
        throw err;
    }
});

// 비디오 수 조회
api.get('/count', verifyAdminToken, async function (req, res) {
    try{
        var sql = "select count(*) as cnt from video where status = 'act' and videoType='vod'";
        const [result] = await con.query(sql);
        res.status(200).send({
            status: 200,
            data: result[0].cnt,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 최신 업로드 영상 조회
api.get('/latest', verifyToken, async function (req, res) {
    try{
        var sql = "select UID as videoUID, videoThumbnail from video where videoType='vod' and status='act' order by regDate desc limit 20";
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

// 요즘 인기있는 영상 조회
api.get('/favorite', verifyToken, async function (req, res) {
    try{
        // 시청 수 많은 순으로 조회
        var sql = "select b.UID as videoUID, b.videoThumbnail " +
            "from video_history a " +
            "right join video b on b.UID = a.videoUID " +
            "where b.status = 'act' and b.videoType = 'vod' " +
            "group by b.UID " +
            "order by count(a.videoUID) desc, a.updateDate desc " +
            "limit 20";
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

// vod 검색
api.get('/search', verifyToken, async function (req, res) {
    try{
        var sql = "select a.UID, c.teacherImg, a.videoName, c.teacherNickName as teacherName, a.contentsPath, b.categoryName, a.videoLevel, a.playTimeValue, e.rectImgPath as imgPath " +
            "from video a " +
            "join category b on a.categoryUID = b.UID " +
            "join teacher c on a.teacherUID = c.UID " +
            "left join video_acclist d on a.UID = d.videoUID " +
            "left join acc e on d.accUID = e.UID " +
            "where a.status='act' ";

        const categoryUIDs = req.query.categoryUIDs ? req.query.categoryUIDs : '';
        const videoLevels = req.query.videoLevels ? req.query.videoLevels : '';
        const playTimeValues = req.query.playTimeValues ? req.query.playTimeValues : '';
        const teacherUIDs = req.query.teacherUIDs ? req.query.teacherUIDs : '';
        const videoType = req.query.videoType ? req.query.videoType : '';

        if(categoryUIDs.length != 0){
            sql += `and b.UID in (${categoryUIDs}) `;
        }

        if(videoLevels.length != 0){
            sql += `and a.videoLevel in (${videoLevels}) `;
        }

        if(playTimeValues.length != 0){
            sql += `and a.playTimeValue in (${playTimeValues}) `;
        }

        if(teacherUIDs.length != 0){
            sql += `and c.UID in (${teacherUIDs}) `;
        }

        sql += `and a.videoType = '${videoType}' `;

        sql += "order by a.regDate desc, a.UID desc";

        const [result] = await con.query(sql);
        
        res.status(200).send({
            status: 200,
            data:makevideoList(result),
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 라이브 일정 조회
api.get('/live',
    verifyToken,
    [
        check("startDate", "startDate is required").not().isEmpty(),
        check("endDate", "endDate is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const startDate = req.query.startDate;
                const endDate = req.query.endDate;
                var sql = "select a.UID as videoUID, a.liveStartDate, b.teacherImg, a.videoName, b.teacherName, a.videoLevel, a.playTimeValue " +
                    "from video a " +
                    "join teacher b on b.UID = a.teacherUID " +
                    "where a.videoType = 'live' and (date_format(a.liveStartDate, '%Y-%m-%d') between ? and ?) and a.status = 'act' " +
                    "order by a.liveStartDate";
                const sqlData = [startDate, endDate];
                const [result] = await con.query(sql, sqlData);

                res.status(200).json({
                    status: 200,
                    data: result,
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// 예정된 라이브 수 조회
api.get('/live/not_start', verifyAdminToken, async function (req, res) {
    try{
        var sql = "select count(*) as cnt from video where status = 'act' and videoType='live' and date_format(liveStartDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d')";
        const [result] = await con.query(sql);
        res.status(200).send({
            status: 200,
            data: result[0].cnt,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 라이브 top5 조회
api.get('/live/top5', verifyAdminToken, async function (req, res) {
    try {
        var sql = "select b.videoName, c.categoryName, d.teacherName, count(a.videoUID) as count " +
            "from video_history a " +
            "join video b on a.videoUID = b.UID " +
            "join category c on b.categoryUID = c.UID " +
            "join teacher d on b.teacherUID = d.UID " +
            "where b.videoType = 'live' " +
            "group by a.videoUID " +
            "order by count(a.videoUID) desc " +
            "limit 5";
        const [result] = await con.query(sql);
        res.status(200).send({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// VOD top5 조회
api.get('/top5', verifyAdminToken, async function (req, res) {
    try {
        var sql = "select b.videoName, c.categoryName, d.teacherName, count(a.videoUID) as count " +
            "from video_history a " +
            "join video b on a.videoUID = b.UID " +
            "join category c on b.categoryUID = c.UID " +
            "join teacher d on b.teacherUID = d.UID " +
            "where b.videoType = 'vod' " +
            "group by a.videoUID " +
            "order by count(a.videoUID) desc " +
            "limit 5";
        const [result] = await con.query(sql);
        res.status(200).send({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 추천 영상 조회
api.get('/recommend/:userUID', verifyToken, async function (req, res) {
    try{
        var sql = "select a.UID, a.videoThumbnail " +
            "from video a " +
            "join my_category b on a.categoryUID = b.categoryUID " +
            "where b.userUID = ? and a.status = 'act' and a.videoType = 'vod' " +
            "order by a.regDate desc " +
            "limit 20";
        const sqlData = req.params.userUID;
        const [result] = await con.query(sql, sqlData);

        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// 운동 종목 카테고리 상세 목록
api.get('/category/:categoryUID',
    verifyToken,
    [
        check("videoType", "videoType is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const categoryUID = req.params.categoryUID;
                const videoType = req.query.videoType;

                var sql = "select a.UID, a.contentsPath, b.teacherImg, a.videoName, b.teacherNickname, c.categoryName, a.videoLevel, a.playTimeValue, e.rectImgPath as imgPath " +
                    "from video a " +
                    "join teacher b on a.teacherUID = b.UID " +
                    "join category c on a.categoryUID = c.UID " +
                    "left join video_acclist d on a.UID = d.videoUID " +
                    "left join acc e on d.accUID = e.UID " +
                    "where a.categoryUID = ? and a.videoType= ? and a.status = 'act' " +
                    "order by a.regDate desc, a.UID desc";
                const sqlData = [categoryUID, videoType];
                const [result] = await con.query(sql, sqlData);
                
                res.status(200).send({
                    status: 200,
                    data:  makevideoList(result),
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// 상세보기 - 비디오 설명
api.get('/:videoUID', verifyToken, async function (req, res) {
    try{
        var sql = "select a.UID, a.videoType, a.videoName, a.categoryUID, b.categoryName, a.videoLevel, a.totalPlayTime, a.playTimeValue, a.videoThumbnail, a.contentsPath, " +
            "a.playContents, a.teacherUID, a.videoURL, a.liveStartDate, a.liveEndDate, a.isPlayBGM, a.status, " +
            "cast((case	when a.videoLevel = '초급'  then calorie1 " +
            "when a.videoLevel = '중급' then calorie2 " +
            "when a.videoLevel = '고급' then calorie3 end) as char(4)) as consume " + // float -> varchar : 처음 설정이 varchar 였어서 앱에서 타입 에러 발생하기 때문에
            "from video a " +
            "join category b on a.categoryUID = b.UID " +
            "where a.UID = ?";

        const videoUID = req.params.videoUID;
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

// cms - cloud에 비디오 업로드
// 거의 모든 변수가 var이 아니라 const 인 것 같아서 검토 필요
api.post('/signature', function (req, res) {
    var secret_id = "IKIDTnsrdAQQAdqnTs1tVrxnMfhfcVM8oIXW";
    var secret_key = "mIZaKo2zg6GAoCJAk47uQgfOs52i8HAm";

    // Determine the current time and expiration time of the signature
    var current = parseInt((new Date()).getTime() / 1000)
    var expired = current + 86400; // Signature validity period: 1 day

    // Enter parameters into the parameter list
    var arg_list = {
        secretId: secret_id,
        currentTimeStamp: current,
        expireTime: expired,
        random: Math.round(Math.random() * Math.pow(2, 32))
    }

    // Calculate the signature
    var orignal = querystring.stringify(arg_list);
    var orignal_buffer = new Buffer(orignal, "utf8");

    var hmac = crypto.createHmac("sha1", secret_key);
    var hmac_buffer = hmac.update(orignal_buffer).digest();

    var signature = Buffer.concat([hmac_buffer, orignal_buffer]).toString("base64");

    res.status(200).json({
        status: 200,
        data: {
            signature: signature
        },
        message: "success"
    });
});

// cms - 영상 업로드
api.post('/',
        verifyAdminToken, 
        [
            check("teacherUID", "teacherUID is required").not().isEmpty(),
            check("categoryUID", "categoryUID is required").not().isEmpty(),
            check("videoName", "videoName is required").not().isEmpty(),
            check("videoLevel", "videoLevel is required").not().isEmpty(),
            check("totalPlayTime", "totalPlayTime is required").not().isEmpty(),
            check("playContents", "playContents is required").not().isEmpty(),
            check("playTimeValue", "playTimeValue is required").not().isEmpty(),
            check("status", "status is required").not().isEmpty(),
            check("videoType", "videoType is required").not().isEmpty(),
            check("videoURL", "videoURL is required").not().isEmpty(),
            check("isPlayBGM", "isPlayBGM is required").not().isEmpty(),
            check("liveStartDate", "liveStartDate is required").not().isEmpty(),
            check("liveEndDate", "liveEndDate is required").not().isEmpty()
        ],
        async function (req, res) {
            const errors = getError(req, res);
            if (errors.isEmpty()) {
                try{
                    const adminUID = req.adminUID;
                    const teacherUID = req.body.teacherUID;
                    const categoryUID = req.body.categoryUID;
                    const videoName = req.body.videoName;
                    const videoLevel = req.body.videoLevel;
                    const totalPlayTime = req.body.totalPlayTime;
                    const playContents = req.body.playContents;
                    const playTimeValue = req.body.playTimeValue;
                    const status = req.body.status;
                    const videoType = req.body.videoType;
                    const videoURL = req.body.videoURL;
                    const isPlayBGM = req.body.isPlayBGM;
                    const liveStartDate = req.body.liveStartDate;
                    const liveEndDate = req.body.liveEndDate;
    
                    var sql = "insert video(teacherUID, categoryUID, videoName, videoLevel, totalPlayTime, playContents, playTimeValue, status, videoType, videoURL, isPlayBGM, liveStartDate, liveEndDate, regUID) " +
                        "values (?)";
                    const sqlData = [teacherUID, categoryUID, videoName, videoLevel, totalPlayTime, playContents, playTimeValue, status, videoType, videoURL, isPlayBGM, liveStartDate, liveEndDate, adminUID];
                    const [result] = await con.query(sql, [sqlData]);

                    res.status(200).json({
                        status: 200,
                        data: {
                            videoUID: result.insertId
                        },
                        message: "success"
                    });
                } catch (err) {
                    throw err;
                }
            }
   
});

// cms - 영상 수정
api.put('/:videoUID', 
        verifyAdminToken, 
        [
            check("teacherUID", "teacherUID is required").not().isEmpty(),
            check("categoryUID", "categoryUID is required").not().isEmpty(),
            check("videoName", "videoName is required").not().isEmpty(),
            check("videoLevel", "videoLevel is required").not().isEmpty(),
            check("totalPlayTime", "totalPlayTime is required").not().isEmpty(),
            check("playContents", "playContents is required").not().isEmpty(),
            check("playTimeValue", "playTimeValue is required").not().isEmpty(),
            check("status", "status is required").not().isEmpty(),
            check("videoType", "videoType is required").not().isEmpty(),
            check("videoURL", "videoURL is required").not().isEmpty(),
            check("isPlayBGM", "isPlayBGM is required").not().isEmpty(),
            check("liveStartDate", "liveStartDate is required").not().isEmpty(),
            check("liveEndDate", "liveEndDate is required").not().isEmpty()
        ],
        async function (req, res) {
            const errors = getError(req, res);
            if (errors.isEmpty()) {
                try{
                    const adminUID = req.adminUID;
                    const videoUID = req.params.videoUID;
                    const teacherUID = req.body.teacherUID;
                    const categoryUID = req.body.categoryUID;
                    const videoName = req.body.videoName;
                    const videoLevel = req.body.videoLevel;
                    const totalPlayTime = req.body.totalPlayTime;
                    const playContents = req.body.playContents;
                    const playTimeValue = req.body.playTimeValue;
                    const status = req.body.status;
                    const videoType = req.body.videoType;
                    const videoURL = req.body.videoURL;
                    const isPlayBGM = req.body.isPlayBGM;
                    const liveStartDate = req.body.liveStartDate;
                    const liveEndDate = req.body.liveEndDate;
    
                    var sql = "update video set teacherUID = ?, categoryUID = ?, videoName = ?, videoLevel = ?, totalPlayTime = ?, playContents = ?, playTimeValue = ?, status = ?, videoType = ?, videoURL = ?, " +
                        "isPlayBGM = ?, liveStartDate = ?, liveEndDate = ?, updateUID = ? " +
                        "where UID = ?";
                    const sqlData = [teacherUID, categoryUID, videoName, videoLevel, totalPlayTime, playContents, playTimeValue, status, videoType, videoURL, isPlayBGM, liveStartDate, liveEndDate, adminUID, videoUID];
                    await con.query(sql, sqlData);

                    res.status(200).json({
                        status: 200,
                        data: "true",
                        message: "success"
                    });
                } catch (err) {
                    throw err;
                }
            }  
});


// cms - 영상 이미지 업로드
api.put('/image/:videoUID',
    verifyAdminToken,
    upload.single("img"),
    async function (req, res) {
        try{
            const videoUID = req.params.videoUID;
            const filename = req.file.filename;
            const imgType = req.body.imgType;
            var sql = `update video set ${imgType} = ? where UID = ?`;
            const sqlData = [filename, videoUID];
            await con.query(sql, sqlData);

            res.status(200).json({
                status: 200,
                data: {
                    filename: filename
                },
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// cms - 영상 활성화 여부 수정
api.put('/status/:videoUID', 
        verifyAdminToken,
        [
            check("status", "status is required").not().isEmpty()
        ],
        async function (req, res) {
            const errors = getError(req, res);
            if (errors.isEmpty()) {
                try{
                    const adminUID = req.adminUID;
                    const videoUID = req.params.videoUID;
                    const status = req.body.status;
                    var sql = "update video set status = ?, updateUID = ? where UID = ?";
                    const sqlData = [status, adminUID, videoUID];
                    await con.query(sql, sqlData);

                    res.status(200).send({
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

function makevideoList(result) {
    var responseData = [];
    var obj = {};
    var rowIdx = -1;

    // 비디오마다 운동기구 리스트 추가
    if (result.length > 0) {
        for (var i in result) {
            if (result[i].UID != rowIdx) {
                if (rowIdx != -1)
                    responseData.push(obj);

                obj = {};
                rowIdx = result[i].UID;
                obj.videoUID = result[i].UID;
                obj.contentsPath = result[i].contentsPath;
                obj.teacherImg = result[i].contentsPath;
                obj.teacherName = result[i].teacherNickname;
                obj.videoName = result[i].videoName;
                obj.categoryName = result[i].categoryName;
                obj.videoLevel = result[i].videoLevel;
                obj.playTimeValue = result[i].playTimeValue;
                obj.accImgPath = [];
            }

            if (result[i].imgPath != null)
                obj.accImgPath.push(result[i].imgPath);
        }

        responseData.push(obj);
    }

    return responseData;
}

module.exports = api;
