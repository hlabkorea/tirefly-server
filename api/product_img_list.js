const express = require('express');
const db = require('./config/database.js');
const api = express.Router();

// 상품의 소개이미지 조회
api.get('/:productUID',
    function (req, res, next) {
        var productUID = req.params.productUID;
        var sql = "select product_img_list.imgPath " +
            "from product_img_list " +
            "right join product on product.UID = product_img_list.productUID " +
            "where product.UID = ?";

        db.query(sql, productUID, function (err, result) {
            if (err) throw err;

            res.status(200).json({
                status: 200,
                data: result,
                message: "success"
            });
        });
    }
);

module.exports = api;