const express = require("express"); 
const { con } = require('./config/database.js');
const api = express.Router();
const { upload } = require('./config/uploadFile.js');
const { getPageInfo } = require('./config/paging.js'); 
const { verifyAdminToken } = require("./config/authCheck.js");
const { check } = require('express-validator');
const { sendInquiryMail, sendAnswerMail } = require('./config/mail.js');
const { getError } = require('./config/requestError.js');
const pageCnt10 = 10;

// cms - 문의 조회
api.get("/", verifyAdminToken, async function (req, res) {
    try {
        var sql = "select inquiry.UID as inquiryUID, inquiry.inquiryType, inquiry.inquiryTitle, inquiry.inquiryContents, inquiry.userName, inquiry.userEmail, inquiry.userGroup, " +
            "inquiry.userCellNumber, inquiry.inquiryComplete, ifnull(completeMsg, '') as completeMsg, ifnull(admin.name, '') as adminName, inquiry.regDate, inquiry.updateDate " +
            "from inquiry " +
            "left join admin on inquiry.updateUID = admin.UID ";
        const currentPage = req.query.page ? parseInt(req.query.page) : 1;
        const complete = req.query.complete ? req.query.complete : 'all';

        if (complete != 'all')
            sql += " where inquiry.inquiryComplete = " + complete;

        var countSql = sql + ";";
        sql += " order by inquiry.regDate desc, inquiry.UID desc";

        const offset = (parseInt(currentPage) - 1) * pageCnt10;
        sql += ` limit ${offset}, ${pageCnt10}`;

        const [result] = await con.query(countSql + sql);
        const {
            startPage,
            endPage,
            totalPage
        } = getPageInfo(currentPage, result[0].length, pageCnt10);
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
});

// 미처리 문의 조회
api.get('/incomplete', verifyAdminToken, async function (req, res) {
    try {
        var sql = "select UID as inquiryUID, inquiryType, inquiryTitle, inquiryContents, userName, userEmail, userGroup, userCellNumber, datediff(now(), regDate) as datediff, regDate " +
            "from inquiry where inquiryComplete = 0";
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

// cms - 문의 상세조회
api.get("/:inquiryUID", verifyAdminToken, async function (req, res) {
    try {
        const inquiryUID = req.params.inquiryUID;
        var sql = "select inquiryType, inquiryTitle, inquiryContents, userName, userEmail, userGroup, userCellNumber, inquiryComplete, ifnull(completeMsg, '') as completeMsg " +
            "from inquiry where UID = ?";
        const [result] = await con.query(sql, inquiryUID);
        res.status(200).json({
            status: 200,
            data: result[0],
            message: "success"
        });
    } catch (err) {
        throw err;
    }

});

// 문의 하기
api.post("/",
    [
        check("type", "type is required").not().isEmpty(),
        check("title", "title is required").not().isEmpty(),
        check("name", "name is required").not().isEmpty(),
        check("email", "email is required").not().isEmpty(),
        check("contents", "contents is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const type = req.body.type;
                const title = req.body.title;
                const name = req.body.name;
                const email = req.body.email;
                const group = req.body.group;
                const cellNumber = req.body.cellNumber;
                const contents = req.body.contents;

                sendInquiryMail(type, title, name, email, group, cellNumber, contents);

                var sql = "insert inquiry(inquiryType, inquiryTitle, userName, userEmail, userGroup, userCellNumber, inquiryContents, inquiryComplete) " +
                    "values (?, 0)";
                const sqlData = [type, title, name, email, group, cellNumber, contents];
                await con.query(sql, [sqlData]);
                
                res.status(200).json({
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

// 문의할 때 파일 첨부하기
api.put("/file/:inquiryUID", upload.single("file"), async function (req, res) {
    try {
        const inquiryUID = req.params.inquiryUID;
        const filename = req.file.filename;
        var sql = "update inquiry set inquiryFilePath = ? where UID = ?";
        const sqlData = [filename, inquiryUID];
        await con.query(sql, sqlData);

        res.status(200).json({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// cms - 문의 완료하기
api.put("/:inquiryUID",
    verifyAdminToken,
    [
        check("completeMsg", "completeMsg is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const adminUID = req.adminUID;
                const inquiryUID = req.params.inquiryUID;
                const completeMsg = req.body.completeMsg;
                const email = await selectEmailFromInquiry(inquiryUID);
                sendAnswerMail(email, completeMsg);
                await completeInquiry(completeMsg, adminUID, inquiryUID);

                res.status(200).json({
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

// 문의자의 이메일 조회
async function selectEmailFromInquiry(inquiryUID) {
    var sql = "select userEmail from inquiry where UID = ?";
    const [result] = await con.query(sql, inquiryUID);
    return result[0].userEmail;
}

// 문의 답변 완료 처리
async function completeInquiry(completeMsg, adminUID, inquiryUID) {
    var sql = "update inquiry set completeMsg = ?, inquiryComplete=1, updateUID = ? where UID = ?";
    const sqlData = [completeMsg, adminUID, inquiryUID];
    await con.query(sql, sqlData);
}

module.exports = api;
