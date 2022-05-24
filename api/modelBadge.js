const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require("./config/authCheck.js");



api.get('/:modelUID',
    async function (req, res) {
        try {
            const modelUID = req.params.modelUID;

            var sql = "select b.UID as UID, b.name, b.imgPath from modelBadge a "
            + "join badge b on a.badge = b.UID "
            + "where a.modelUID = ?"
            const [result] = await con.query(sql, modelUID);

            res.status(200).json({
                status : 200,
                data : result,
                message : "success"
            })
        } catch (err) {
            throw err;
        }
    }
)


module.exports = api;