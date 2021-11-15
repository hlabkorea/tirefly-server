const express = require('express');
const db = require('./config/database.js');
const {verifyToken, verifyAdminToken} = require("./config/authCheck.js");
const {upload} = require('./config/uploadFile.js');
const {addSearchSql} = require('./config/searchSql.js');
const {getPageInfo} = require('./config/paging.js'); 
const api = express.Router();
const pageCnt15 = 15;

// 강사 목록 조회
api.get('/', verifyToken, function (req, res) {
	var sql = "select UID as teacherUID, teacherName, teacherNickName from teacher where teacher.status = 'act' ";
	var searchType = req.query.searchType ? req.query.searchType : '';
	var searchWord = req.query.searchWord ? req.query.searchWord : '';

	sql += addSearchSql(searchType, searchWord);

	var currentPage = req.query.page ? parseInt(req.query.page) : '';
	console.log(currentPage);
	if(currentPage.length != 0){ // 페이징으로 조회
		console.log('페이징으로 조회')
		var countSql = sql + ";";

		sql += "limit ?, " + pageCnt15;
		var data = parseInt(currentPage - 1) * pageCnt15;
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
	else{ // 전체 조회
		db.query(sql, function (err, result, fields) {
			if (err) throw err;

			res.status(200).json({status:200, data: result, message: "success"});
		});
	}
});

// cms - 강사 추가
api.post('/', verifyAdminToken, function (req, res) {
	var adminUID = req.adminUID;
	var tcName = req.body.tcName;
	var tcNick = req.body.tcNick;
	var tcGender = req.body.tcGender;
	var tcCareer = req.body.tcCareer;
	var tcInfo = req.body.tcInfo;
	var tcInsta = req.body.tcInsta;
	var tcYoutube = req.body.tcYoutube;
	var status = req.body.status;
	var sql = "insert teacher(teacherName, teacherNickName, teacherGender, teacherCareer, teacherIntroduce, teacherInstagram, teacherYoutube, status, regUID) "
			+ "values (?, ?, ?, ?, ?, ?, ?, ?, ?)";
	var data = [tcName, tcNick, tcGender, tcCareer, tcInfo, tcInsta, tcYoutube, status, adminUID];
	db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: {teacherUID: result.insertId}, message: "success"});
	});
});


// cms - 강사 정보 수정
api.put('/:teacherUID', verifyAdminToken, function (req, res) {
	var adminUID = req.adminUID;
	var teacherUID = req.params.teacherUID;
	var tcName = req.body.tcName;
	var tcNick = req.body.tcNick;
	var tcGender = req.body.tcGender;
	var tcCareer = req.body.tcCareer;
	var tcInfo = req.body.tcInfo;
	var tcInsta = req.body.tcInsta;
	var tcYoutube = req.body.tcYoutube;
	var status = req.body.status;
	var sql = "update teacher set teacherName = ?, teacherNickName = ?, teacherGender = ?, teacherCareer = ?, teacherIntroduce = ?, teacherInstagram = ?, teacherYoutube = ?, updateUID = ?, teacher.status = ? "
			+ "where UID = ?";
	var data = [tcName, tcNick, tcGender, tcCareer, tcInfo, tcInsta, tcYoutube, adminUID, status, teacherUID];
	db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({status:200, data: "success", message: "success"});
	});
});
// cms - 강사 이미지 업로드
api.put('/image/:teacherUID', 
		verifyAdminToken,
		upload.single("img"), 
		function (req, res) {
			var teacherUID = req.params.teacherUID;
			var filename = req.file.filename;
			var sql = "update teacher set teacherImg = ? where UID = ?";
			var data = [filename, teacherUID];
			db.query(sql, data, function (err, result, fields) {
				if (err) throw err;

				res.status(200).json({status:200, data:"true", message: "success"});
			});
		}
);

// 강사 정보 조회
api.get('/:teacherUID', verifyToken, function (req, res) {
  var sql = "select UID, teacherImg, teacherNickName, teacherGender, teacherIntroduce, teacherCareer, teacherInstagram, teacherYoutube "
          + "from teacher "
          + "where UID = ?";
  var data = req.params.teacherUID;

  db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).json({
                          status:200,
                          data: result[0],
                          message:"success"}
		);
	});
});

module.exports = api;
