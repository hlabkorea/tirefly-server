const express = require('express');
const { con } = require('./config/database.js');
const api = express.Router();

// 상품의 소개이미지 조회
api.get('/:productUID',
    async function (req, res, next) {
        try{
            const productUID = req.params.productUID;
            var sql = "select a.imgPath " +
                "from product_img_list a " +
                "right join product b on b.UID = a.productUID " +
                "where b.UID = ?";
            const [result] = await con.query(sql, productUID);
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

module.exports = api;