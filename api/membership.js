const express = require('express');
const db = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");
const api = express.Router();
const { getCurrentDateTime, toHypenDateFormat } = require('./config/date.js');

// 멤버십 소유자인지 조회
api.get('/auth/:userUID', verifyToken, function (req, res) {
        var sql = "select * from membership where userUID = ? order by regDate desc limit 1";
		var data = req.params.userUID;

        db.query(sql, data, function (err, result) {
			if (err) throw err;
			
			if(result.length != 0){
				var endDate = result[0].endDate;
				endDate = toHypenDateFormat(endDate);
				var currentDateTime = getCurrentDateTime();

				if(currentDateTime <= endDate)
					res.status(200).json({status:200,  data: "true", message:"success"});
				else
					res.status(403).json({status:403,  data: "false", message:"이용 중인 멤버십이 존재합니다. 남은 기간을 소진한 후 다시 이용해주세요."});
			}
			else
				res.status(200).json({status:200,  data: "false", message:"fail"});
        });
});

// 멤버십 정보 조회
api.get('/:userUID', verifyToken, function (req, res) {
    var userUID = req.params.userUID;
    var membership_sql = "select level, startDate, endDate from membership " +
        "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and userUID = ?";

    db.query(membership_sql, userUID, function (err, result, fields) {
        if (err) throw err;

        var level = "normal";
        var startDate = 0;
        var endDate = 0;
        var maxCount = 0;

        // 멤버십 결제자인지 확인
        if (result.length != 0) {
            level = result[0].level;
            startDate = result[0].startDate;
            endDate = result[0].endDate;

            switch (level) {
                case "single":
                    result[0].maxCount = 1;
                    break;
                case "IOS_mobile":
                case "mobile":
                    result[0].maxCount = 1;
                    break;
                case "friends":
                    result[0].maxCount = 3;
                    break;
                case "family":
                    result[0].maxCount = 5;
                    break;
            }

            res.status(200).send({
                status: 200,
                data: result[0],
                message: "success"
            });
        } else { // Invited 유저인지 확인
            var membership_group_sql = "select membership.startDate, membership.endDate " +
                "from membership_group " +
                "join membership on membership.userUID = membership_group.ownerUID " +
                "where date_format(membership.endDate, '%Y-%m-%d') >= date_format(now(), '%Y-%m-%d') and membership_group.userUID = ? " +
                "order by membership.endDate desc " +
                "limit 1";
            db.query(membership_group_sql, userUID, function (err, result, fields) {
                if (err) throw err;

                if (result.length != 0) {
                    level = "invited";
                    startDate = result[0].startDate;
                    endDate = result[0].endDate;
                }

                res.status(200).send({
                    status: 200,
                    data: {
                        level: level,
                        startDate: startDate,
                        endDate: endDate,
                        maxCount: maxCount
                    },
                    message: "success"
                });
            });
        }
    });
});

// faq 삭제
api.delete('/',
    function (req, res) {
        var sql = 'delete from membership where userUID = 1523';

        db.query(sql, function (err, result) {
            if (err) throw err;

            res.status(200).json({
                status: 200,
                data: "true",
                message: "success"
            });
        });
    }
);

module.exports = api;