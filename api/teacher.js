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
	var sql = "select UID as teacherUID, teacherImg, teacherName, teacherNickName, teacherGender, regDate,status from teacher where UID >= 1 ";
	var searchType = req.query.searchType ? req.query.searchType : '';
	var searchWord = req.query.searchWord ? req.query.searchWord : '';
	var status = req.query.status ? req.query.status : 'act';
	var data = [];

	if(status != "all"){
		sql += "and teacher.status = ? ";
		data.push(status);
	}

	sql += addSearchSql(searchType, searchWord);
	
	sql += "order by UID desc ";

	var currentPage = req.query.page ? parseInt(req.query.page) : '';
	if(currentPage.length != 0){ // 페이징으로 조회
		var countSql = sql + ";";

		sql += "limit ?, " + pageCnt15;
		var pageLimit = parseInt(currentPage - 1) * pageCnt15;
		console.log(pageLimit);
		if(status != "all")
			data.push(status);
		data.push(pageLimit);
		const exec = db.query(countSql+sql, data, function (err, result, fields) {
			if (err) throw err;

			var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt15);

			res.status(200).json({status:200, 
							  data: {
								paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
								result: result[1]
							  }, 
							  message:"success"});
		});
		console.log(exec.sql);
	}
	else{ // 전체 조회
		db.query(sql, data, function (err, result, fields) {
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

// cms - 이미지 활성화 여부 수정
api.put('/status/:teacherUID', verifyAdminToken, function (req, res) {
	var teacherUID = req.params.teacherUID;
	var status = req.body.status;
	var sql = "update teacher set status = ? where UID = ?";
	var data = [status, teacherUID];
	db.query(sql, data, function (err, result, fields) {
		if (err) throw err;

		res.status(200).send({status:200, data: "true", message:"success"});
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

				res.status(200).json({status:200, data:{filename: filename}, message: "success"});
			});
		}
);

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

// 강사 정보 조회
api.get('/:teacherUID', verifyToken, function (req, res) {
  var sql = "select UID, teacherImg, teacherName, teacherNickName, teacherGender, teacherIntroduce, teacherCareer, teacherInstagram, teacherYoutube, status "
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
