const express = require('express');
const { con } = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { getPageInfo } = require('./config/paging.js'); 
const api = express.Router();
const pageCnt30 = 30;

// cms - 관리자 로그 조회
api.get('/', 
        verifyAdminToken, 
        async function (req, res) {
            try{
                const currentPage = req.query.page ? parseInt(req.query.page) : 1;
                const offset = parseInt(currentPage - 1) * pageCnt30;
                var sql = "select a.UID as logUID, a.adminUID, a.action, if(a.action = '멤버십 제공', d.email, '-') as email, b.name, b.department, a.regDate  "
                        + "from admin_log a "
                        + "join admin b on a.adminUID = b.UID "
                        + "left join membership c on b.UID = c.regUID "
                        + "left join user d on c.userUID = d.UID ";
                var countSql = sql + ";";
                sql += "order by regDate desc " +
                    `limit ${offset}, ${pageCnt30}`;

                const [result] = await con.query(countSql+sql);
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
            } catch (err) {
                throw err;
            }
        }
);

module.exports = api;