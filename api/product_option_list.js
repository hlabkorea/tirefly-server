const express = require('express');
const db = require('./config/database.js');
const api = express.Router();

// 상품의 옵션 조회
api.get('/:productUID', 
        function (req, res, next) {
			var productUID = req.params.productUID;
			var sql = "select product_option_list.UID as optionUID, optionName "
					+ "from product_option_list "
					+ "right join product on product.UID = product_option_list.productUID "
					+ "where product.UID = ?";

			db.query(sql, productUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: result, message:"success"});
			});
        }
);

module.exports = api;