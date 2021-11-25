exports.addSearchSql = (searchType, searchWord) => {
	var sql = "";
	if (searchType.length != 0){
		if (searchType == "videoName") 
			sql = "and video.videoName ";
		else if (searchType == "teacherName")
			sql = "and teacher.teacherName ";
		else if (searchType == "teacherNick")
			sql = "and teacher.teacherNickname ";
		else if (searchType == "userEmail")
			sql = "and user.email ";
		else if (searchType == "userTel")
			sql = "and user.cellNumber ";
		else if (searchType == "programName")
			sql = "and program.programName ";

		sql += "LIKE '%" + searchWord + "%' ";
	}

	return sql;
}

exports.addVodSearchSql = (categoryUIDs, videoLevels, playTimeValues, teacherUIDs) => {
	var sql = "";
	var data = [];
	if(categoryUIDs.length != 0){
		sql = "and category.UID in (?) ";
		data.push(categoryUIDs.split(','));
	}

	if(videoLevels.length != 0){
		sql += "and video.videoLevel in (?) ";
		data.push(videoLevels.split(','));
	}

	if(playTimeValues.length != 0){
		sql += "and video.playTimeValue in (?) ";
		data.push(playTimeValues.split(','));
	}

	if(teacherUIDs.length != 0){
		sql += "and teacher.UID in (?) ";
		data.push(teacherUIDs.split(','));
	}

	return {sqlResult: sql, data};
}

exports.addCellSearchSql = (searchType, searchWord, tellType) => {
	var sql = "";
	if(searchType.length != 0){
		if(searchType == "buyerEmail") {
			sql = "and user.email ";
		} 
		else if(searchType == "buyerTel"){
			if(tellType == "user")
				sql = "and user.cellNumber ";
			else if(tellType == "payment")
				sql = "and payment.buyerTel ";
		}
		else if(searchType == "merchantUid"){
			sql = "and payment.merchantUid ";
		}

		sql += "LIKE '%" + searchWord + "%' ";
	}
	return sql;
}