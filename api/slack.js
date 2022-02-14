const express = require('express');
const { con } = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { sendSlackMsg, getUserList } = require('./config/slack.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// cms - 프로그램의 비디오 목록 등록
api.get('/members',
    verifyAdminToken,
    async function (req, res) {
        try{
            const result = await getUserList();

            res.status(200).json({
                status: 200,
                data: result,
                message: "success"
            });
        } catch (err) {
            throw err;
        }
    }
);

// cms - 프로그램의 비디오 목록 등록
api.post('/',
    verifyAdminToken,
    [
        check("type", "type is required").not().isEmpty(),
        check("dest", "dest is required").not().isEmpty(),
        check("message", "message is required").not().isEmpty()
    ],
    async function (req, res) {
        const errors = getError(req, res);
        if(errors.isEmpty()){
            try{
                const adminUID = req.adminUID;
                const type = req.body.type;
                var dest = req.body.dest;
                var message = req.body.message;
                
                if(type == 'channel')
                    dest = '#' + dest;
                else if(type == 'chat')
                    dest = '@' + dest;

                const from = await selectAdminName(adminUID);
                message = `● ${from} \n: ${message}`;           
                await sendSlackMsg(dest, message);

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

async function selectAdminName(adminUID){
    var sql = "select name from admin where UID = ?";
    const [result] = await con.query(sql, adminUID);
    if(result.length != 0)
        return result[0].name;
    else    
        return '';
}
module.exports = api;