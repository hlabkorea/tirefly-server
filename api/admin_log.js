const express = require('express');
const db = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { getPageInfo } = require('./config/paging.js'); 
const api = express.Router();
const pageCnt30 = 30;

// cms - 관리자 로그 조회
api.get('/', 
        verifyAdminToken, 
        function (req, res) {
            var currentPage = req.query.page ? parseInt(req.query.page) : 1;
            var sql = "select admin_log.UID as logUID, admin_log.adminUID, admin.email, admin.name, admin.department, admin_log.regDate "
                    + "from admin_log "
                    + "join admin on admin_log.adminUID = admin.UID "
                    + "order by regDate desc ";
            var countSql = sql + ";";
            sql += "limit ?, " + pageCnt30;

            db.query(countSql+sql, parseInt(currentPage - 1) * pageCnt30, function (err, result) {
                if (err) throw err;

                var {
                    startPage,
                    endPage,
                    totalPage
                } = getPageInfo(currentPage, result[0].length, pageCnt30);

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
            });
        }
);

module.exports = api;