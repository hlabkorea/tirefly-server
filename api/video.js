const express = require('express');
const db = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const api = express.Router();
const {check} = require('express-validator');
const {getError} = require('./config/requestError.js');
const {getPageInfo} = require('./config/paging.js'); 
const {upload} = require('./config/uploadFile.js');
const {addSearchSql, addVodSearchSql} = require('./config/searchSql.js');
var querystring = require("querystring");
var crypto = require('crypto');
const pageCnt15 = 15;

// cms - vod 정보 조회
api.get('/', verifyAdminToken, function (req, res) {
	var searchType = req.query.searchType ? req.query.searchType : '';
	var searchWord = req.query.searchWord ? req.query.searchWord : '';
	var status = req.query.status ? req.query.status : 'act';
	var sql = "select video.UID as videoUID, video.videoThumbnail, video.videoName, category.categoryName, teacher.teacherName, video.videoLevel, video.regDate, video.status, video.categoryUID "
		  + "from video "
		  + "join teacher on video.teacherUID = teacher.UID "
		  + "join category ON video.categoryUID = category.UID "
		  + "where videoType = 'vod' ";

	sql += addSearchSql(searchType, searchWord);

	var data = [];

	if(status != "all"){
		sql += "and video.status = ? ";
		data.push(status);
		data.push(status);
	}

	sql += "order by video.regDate desc ";

	
	var currentPage = req.query.page ? parseInt(req.query.page) : '';
	if(currentPage != ''){
		var countSql = sql + ";";
		sql += "limit ?, " + pageCnt15;
		data.push(parseInt(currentPage - 1) * pageCnt15);
		
		db.query(countSql+sql, data, function (err, result, fields) {
			if (err) throw err;
			var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt15);

			res.status(200).json({status:200, 
								  data: {
									paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
									result: result[1]
								  }, 
								  message:"success"});
		});
	}
	else {
		db.query(sql, data, function (err, result, fields) {
			if (err) throw err;

			res.status(200).json({status:200, data: result, message:"success"});
		});
	}
});

// cms - cloud에 비디오 업로드
api.post('/signature', function (req, res) {
	var secret_id = "IKIDTnsrdAQQAdqnTs1tVrxnMfhfcVM8oIXW";
	var secret_key = "mIZaKo2zg6GAoCJAk47uQgfOs52i8HAm";
	
	// Determine the current time and expiration time of the signature
	var current = parseInt((new Date()).getTime() / 1000)
	var expired = current + 86400;  // Signature validity period: 1 day

	// Enter parameters into the parameter list
	var arg_list = {
		secretId : secret_id,
		currentTimeStamp : current,
		expireTime : expired,
		random : Math.round(Math.random() * Math.pow(2, 32))
	}

	// Calculate the signature
	var orignal = querystring.stringify(arg_list);
	var orignal_buffer = new Buffer(orignal, "utf8");

	var hmac = crypto.createHmac("sha1", secret_key);
	var hmac_buffer = hmac.update(orignal_buffer).digest();

	var signature = Buffer.concat([hmac_buffer, orignal_buffer]).toString("base64");
	console.log(signature);

	res.status(200).json({status:200, data: {signature: signature}, message:"success"});
});

// cms - 영상 업로드
api.post('/', verifyAdminToken, function (req, res) {
	var adminUID = req.adminUID;
	var teacherUID = req.body.teacherUID;
	var categoryUID = req.body.categoryUID;
	var videoName = req.body.videoName;
	var videoLevel = req.body.videoLevel;
	var totalPlayTime = req.body.totalPlayTime;
	var playContents = req.body.playContents;
	var playTimeValue = req.body.playTimeValue;
	var status = req.body.status;
	var videoType = req.body.videoType;
	var videoURL = req.body.videoURL;
	var isPlayBGM = req.body.isPlayBGM;
	var liveStartDate = req.body.liveStartDate;
	var liveEndDate = req.body.liveEndDate;

	var sql = "insert video(teacherUID, categoryUID, videoName, videoLevel, totalPlayTime, playContents, playTimeValue, status, videoType, videoURL, isPlayBGM, liveStartDate, liveEndDate, regUID) "
			+ "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
	var data = [teacherUID, categoryUID, videoName, videoLevel, totalPlayTime, playContents, playTimeValue, status, videoType, videoURL, isPlayBGM, liveStartDate, liveEndDate, adminUID];
	db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: {videoUID: result.insertId}, message:"success"});
	});
});

// cms - 영상 수정
api.put('/:videoUID', verifyAdminToken, function (req, res) {
	var videoUID = req.params.videoUID;
	var adminUID = req.adminUID;
	var teacherUID = req.body.teacherUID;
	var categoryUID = req.body.categoryUID;
	var videoName = req.body.videoName;
	var videoLevel = req.body.videoLevel;
	var totalPlayTime = req.body.totalPlayTime;
	var playContents = req.body.playContents;
	var playTimeValue = req.body.playTimeValue;
	var status = req.body.status;
	var videoType = req.body.videoType;
	var videoURL = req.body.videoURL;
	var isPlayBGM = req.body.isPlayBGM;
	var liveStartDate = req.body.liveStartDate;
	var liveEndDate = req.body.liveEndDate;

	var sql = "update video set teacherUID = ?, categoryUID = ?, videoName = ?, videoLevel = ?, totalPlayTime = ?, playContents = ?, playTimeValue = ?, status = ?, videoType = ?, videoURL = ?, isPlayBGM = ?, liveStartDate = ?, "
			+ "liveEndDate = ?, updateUID = ? "
			+ "where UID = ?";
	var data = [teacherUID, categoryUID, videoName, videoLevel, totalPlayTime, playContents, playTimeValue, status, videoType, videoURL, isPlayBGM, liveStartDate, liveEndDate, adminUID, videoUID];
	db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: "true", message:"success"});
	});
});


// cms - 영상 이미지 업로드
api.put('/image/:videoUID', 
		verifyAdminToken,
		upload.single("img"), 
		function (req, res) {
			var videoUID = req.params.videoUID;
			var filename = req.file.filename;
			var imgType = req.body.imgType;
			var sql = "update video set " + imgType + " = ? where UID = ?";
			var data = [filename, videoUID]
			db.query(sql, data, function (err, result, fields) {
				if (err) throw err;

				res.status(200).json({status:200, data:{filename: filename}, message: "success"});
			});
		}
);

// cms - 이미지 활성화 여부 수정
api.put('/status/:videoUID', verifyAdminToken, function (req, res) {
	var videoUID = req.params.videoUID;
	var status = req.body.status;
	var adminUID = req.adminUID;
	var sql = "update video set status = ?, updateUID = ? where UID = ?";
	var data = [status, adminUID, videoUID];
	db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).send({status:200, data: "true", message:"success"});
	});
});

// 최신 업로드 영상 조회
api.get('/latest', verifyToken, function (req, res) {
	var sql = "select UID as videoUID, videoThumbnail from video where videoType='vod' and status='act' order by regDate desc limit 20";

	db.query(sql, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// 요즘 인기있는 영상 조회
api.get('/favorite', verifyToken, function (req, res) {
  var sql = "select video.UID as videoUID, video.videoThumbnail "
          + "from video_history "
		  + "right join video on video.UID = video_history.videoUID "
		  + "where video.status = 'act' "
          + "group by video.UID "
          + "order by count(video_history.videoUID) desc, video_history.updateDate desc "
		  + "limit 20";

  db.query(sql, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// vod 검색
api.get('/search', verifyToken, function (req, res) {
	var sql = "select video.UID, teacher.teacherImg, video.videoName, teacher.teacherNickName as teacherName, video.contentsPath, category.categoryName, video.videoLevel, video.playTimeValue, acc.rectImgPath as imgPath "
		    + "from video "
		    + "join category on video.categoryUID = category.UID "
		    + "join teacher on video.teacherUID = teacher.UID "
		    + "left join video_acclist on video.UID = video_acclist.videoUID "
		    + "left join acc on video_acclist.accUID = acc.UID "
		    + "where video.status='act' ";
		  
	var isOption = false;
	var categoryUIDs = req.query.categoryUIDs;
	var videoLevels = req.query.videoLevels;
	var playTimeValues = req.query.playTimeValues;
	var teacherUIDs = req.query.teacherUIDs;
	var videoType = req.query.videoType;

	var {sqlResult, data} = addVodSearchSql(categoryUIDs, videoLevels, playTimeValues, teacherUIDs);
	sql += sqlResult;
	sql += "and video.videoType = ? "
	data.push(videoType);

	sql += "order by video.regDate desc, video.UID desc";

	db.query(sql, data, function (err, result, fields) {
	  if (err) throw err;

	  var responseData = makevideoList(result);

	  res.status(200).send({status:200, data: responseData, message:"success"});
	});
});

// 라이브 일정 조회
api.get('/live', 
        verifyToken, 
        [
          check("startDate", "startDate is required").not().isEmpty(),
		  check("endDate", "endDate is required").not().isEmpty()
        ],
        function (req, res) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var startDate = req.query.startDate;
				var endDate = req.query.endDate;
				var sql = "select video.UID as videoUID, video.liveStartDate, teacher.teacherImg, video.videoName, teacher.teacherName, video.videoLevel, video.playTimeValue "
						+ "from video "
						+ "join teacher on teacher.UID = video.teacherUID "
						+ "where videoType = 'live' and (date_format(video.liveStartDate, '%Y-%m-%d') between ? and ?) and video.status = 'act' "
						+ "order by liveStartDate";
				var data = [startDate, endDate];

				db.query(sql, data, function (err, result, fields) {
				  if (err) throw err;

				  res.status(200).json({status:200, data: result, message:"success"});
				});
			  }
        }
);

// 추천 영상 조회
api.get('/recommend/:userUID', verifyToken, function (req, res) {
  var sql = "select video.UID, video.videoThumbnail "
          + "from video "
		  + "join my_category on video.categoryUID = my_category.categoryUID "
          + "where my_category.userUID = ? and video.status = 'act' "
          + "order by video.regDate desc "
		  + "limit 20";
  var data = req.params.userUID;

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

// 운동 종목 카테고리 상세 목록
api.get('/category/:categoryUID', 
        verifyToken, 
        [
          check("videoType", "videoType is required").not().isEmpty()
        ],
        function (req, res) {
            const errors = getError(req, res);
			if(errors.isEmpty()){
            var sql = "select video.UID, video.contentsPath, teacher.teacherImg, video.videoName, teacher.teacherNickname, category.categoryName, video.videoLevel, video.playTimeValue, acc.rectImgPath as imgPath "
                    + "from video "
                    + "join teacher on video.teacherUID = teacher.UID "
                    + "join category on video.categoryUID = category.UID "
                    + "left join video_acclist on video.UID = video_acclist.videoUID "
                    + "left join acc on video_acclist.accUID = acc.UID "
                    + "where video.categoryUID = ? and video.videoType= ? and video.status = 'act' "
                    + "order by video.regDate desc, video.UID desc";
            var data = [req.params.categoryUID, req.query.videoType];

            db.query(sql, data, function (err, result, fields) {
                if (err) throw err;

                var responseData = makevideoList(result);

                res.status(200).send({status:200, data: responseData, message:"success"});
            });
          }
        }
);

// 상세보기 - 비디오 설명
api.get('/:videoUID', verifyToken, function (req, res) {
  var sql = "select video.UID, video.videoType, video.videoName, video.categoryUID, category.categoryName, video.videoLevel, video.totalPlayTime, video.playTimeValue, video.videoThumbnail, video.contentsPath, "
		  + "video.playContents, video.teacherUID, video.videoURL, video.liveStartDate, video.liveEndDate, video.isPlayBGM, video.status, "
		  + "cast((case	when videoLevel = '초급'  then calorie1 "
		  + "when videoLevel = '중급' then calorie2 "
		  + "when videoLevel = '고급' then calorie3 end) as char(4)) AS consume " // float -> varchar : 처음 설정이 varchar 였어서 앱에서 타입 에러 발생하기 때문에
          + "from video "
          + "join category on video.categoryUID = category.UID "
          + "where video.UID = ?";

  var data = req.params.videoUID;

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		result[0].playContents = result[0].playContents.replace(/\\n/gi, "\n").replace(/\r/gi, "");

		res.status(200).json({status:200, data: result, message:"success"});
	});
});

function makevideoList(result){
	var responseData = [];
    var obj = {};
	var rowIdx = -1;
				
	// 비디오마다 운동기구 리스트 추가
	if(result.length > 0){
	  for(var i in result){
		  console.log(rowIdx);
		if(result[i].UID != rowIdx){
		  if(rowIdx != -1)
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

		if(result[i].imgPath != null)
		  obj.accImgPath.push(result[i].imgPath);
	  }

	  responseData.push(obj);
	}

	return responseData;
}

module.exports = api;
