const express = require('express');
const { con } = require('./config/database.js');
const { verifyToken, verifyAdminToken } = require("./config/authCheck.js");
const api = express.Router();
const { getError } = require('./config/requestError.js');
const { getPageInfo } = require('./config/paging.js'); 
const { upload } = require('./config/uploadFile.js');
const { check } = require('express-validator');
const pageCnt15 = 15;

// cms - 프로그램 상세정보 조회
api.get('/',
    verifyToken,
    async function (req, res) {
        try{
            const searchType = req.query.searchType ? req.query.searchType : '';
            const searchWord = req.query.searchWord ? req.query.searchWord : '';
            const status = req.query.status ? req.query.status : 'act';
            const currentPage = req.query.page ? parseInt(req.query.page) : '';
            var sql = "select UID as programUID, programThumbnail, programName, programLevel, weekNumber, updateDate, status from program where UID >= 1 ";

            if (status != "all") // 상태값에 따라 조회
                sql += `and program.status = '${status}' `;

            if (searchType.length != 0){ // 검색
                if (searchType == "programName")
                    sql += `and programName LIKE '%${searchWord}%' `;
            }

            sql += "order by program.UID desc, program.regDate desc ";
            
            if (currentPage != '') { // 페이징으로 조회
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
            } else { // 전체 조회
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
    }
);

// 프로그램 수 조회
api.get('/count', verifyAdminToken, async function (req, res) {
    try{
        var sql = "select count(*) as cnt from program where status = 'act'";
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

// 재생 수가 많은 프로그램 top5 조회
api.get('/top5', verifyAdminToken, async function (req, res) {
    try {
        var sql = "select b.programName, count(a.programUID) as count " +
            "from program_history a " +
            "join program b on a.programUID = b.UID " +
            "group by programUID " +
            "order by count(a.programUID) desc " +
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

// 프로그램 상세 정보 조회
api.get('/:programUID',
    verifyToken,
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try{
                const programUID = req.params.programUID;
                const userUID = req.query.userUID ? req.query.userUID : 0;

                var resData = await selectProgram(programUID); // 프로그램의 상세정보 조회

                if(userUID != 0) { // 앱에서 조회
                    resData.register = await isRegister(userUID, programUID);  // 사용자의 프로그램 신청 여부 조회
                }

                res.status(200).json({
                    status: 200,
                    data: resData,
                    message: "success"
                });
            } catch (err) {
                throw err;
            }
        }
    }
);

// cms - 프로그램 등록
api.post('/',
    verifyAdminToken,
    [
        check("pgName", "pgName is required").not().isEmpty(),
        check("pgContents", "pgContents is required").not().isEmpty(),
        check("pgLevel", "pgLevel is required").not().isEmpty(),
        check("weekNum", "weekNum is required").not().isEmpty(),
        check("status", "status is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if (errors.isEmpty()) {
            try {
                const adminUID = req.adminUID;
                const programName = req.body.pgName;
                const programContents = req.body.pgContents;
                const programLevel = req.body.pgLevel;
                const weekNumber = req.body.weekNum;
                const status = req.body.status;
                var sql = "insert program(programName, programContents, programLevel, weekNumber, status, regUID) " +
                    "values (?)";
                const sqlData = [programName, programContents, programLevel, weekNumber, status, adminUID];
                const [result] = await con.query(sql, [sqlData]);

                res.status(200).json({
                    status: 200,
                    data: {
                        programUID: result.insertId
                    },
                    message: "success"
                });

            } catch (err) {
                throw err;
            }
        }
    }
);

// cms - 프로그램 이미지 등록/변경
api.put('/image/:programUID',
    verifyAdminToken,
    upload.single("img"),
    async function (req, res) {
        try{
            const programUID = req.params.programUID;
            const filename = req.file.filename;
            const imgType = req.body.imgType; // programThumbnail or contentsPath
            var sql = `update program set ${imgType} = ? where UID = ?`;
            const sqlData = [filename, programUID];

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

// cms - 프로그램 활성화 상태 수정
api.put('/status/:programUID', verifyAdminToken, async function (req, res) {
    try{
        const adminUID = req.adminUID;
        const programUID = req.params.programUID;
        const status = req.body.status;
        var sql = "update program set status = ?, updateUID = ? where UID = ?";
        const sqlData = [status, adminUID, programUID];
        await con.query(sql, sqlData);

        res.status(200).send({
            status: 200,
            data: "true",
            message: "success"
        });
    } catch (err) {
        throw err;
    }
});

// cms - 프로그램 상세정보 수정
api.put('/:programUID', 
        verifyAdminToken, 
        [
            check("pgName", "pgName is required").not().isEmpty(),
            check("pgContents", "pgContents is required").not().isEmpty(),
            check("pgLevel", "pgLevel is required").not().isEmpty(),
            check("weekNum", "weekNum is required").not().isEmpty(),
            check("status", "status is required").not().isEmpty()
        ],
        async function (req, res) {
            const errors = getError(req, res);
            if(errors.isEmpty()){
                try{
                    const adminUID = req.adminUID;
                    const programUID = req.params.programUID;
                    const programName = req.body.pgName;
                    const programContents = req.body.pgContents;
                    const programLevel = req.body.pgLevel;
                    const weekNumber = req.body.weekNum;
                    const status = req.body.status;
                    var sql = "update program set programName = ?, programContents = ?, programLevel = ?, weekNumber = ?, status = ?, updateUID = ? where UID = ?";
                    const sqlData = [programName, programContents, programLevel, weekNumber, status, adminUID, programUID];

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
});

// 프로그램 정보 조회
async function selectProgram(programUID) {
    var sql = "select programName, programContents, programThumbnail, contentsPath, programLevel, weekNumber, status " +
        "from program a " +
        "where UID = ?";
    const [result] = await con.query(sql, programUID);
    return result[0];
}

// 프로그램 신청 여부 조회
async function isRegister(userUID, programUID){
    var sql = "select UID from my_program where userUID = ? and programUID = ?";
    var sqlData = [userUID, programUID];
    const [result] = await con.query(sql, sqlData);
    if(result.length != 0)
        return true;
    else
        return false;
}

module.exports = api;
