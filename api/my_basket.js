const express = require('express');
const db = require('./config/database.js');
const api = express.Router();
const { verifyToken } = require("./config/authCheck.js");
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');

// 장바구니 추가
api.post('/:productUID', 
		verifyToken,
		[
			check("basketList", "basketList is required").not().isEmpty()
		],
        function (req, res, next) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var productUID = req.params.productUID;
				var basketList = req.body.basketList;

				var sql = "insert my_basket(userUID, productUID, optionUID, count) values ?;";
				var datas = [];
				for(var i in basketList){
					var userUID = basketList[i].userUID;
					var optionUID = basketList[i].optionUID;
					var count = basketList[i].count;
					datas.push([userUID, productUID, optionUID, count]);
				}

				console.log(datas);

				db.query(sql, [datas], function (err, result) {
					if (err) throw err;

					res.status(200).json({status:200, data: "true", message:"success"});
				});
			}
        }
);

// 장바구니 조회
api.get('/:userUID', 
		verifyToken,
        function (req, res, next) {
			var userUID = req.params.userUID;
			var sql = "select my_basket.UID as myBasketUID, my_basket.productUID, product_img_list.imgPath, product.korName, product.engName, product.originPrice, product.discountRate, product.discountPrice, "
					+ "product.shippingFee, product_option_list.optionName, my_basket.count "
					+ "from my_basket "
					+ "join product on my_basket.productUID = product.UID "
					+ "join product_option_list on my_basket.optionUID = product_option_list.UID "
					+ "join product_img_list on product_img_list.productUID = product.UID "
					+ "where userUID = ? "
					+ "group by my_basket.UID "
					+ "order by my_basket.regDate desc";

			db.query(sql, userUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: result, message:"success"});
			});
        }
);

// 장바구니 배열 삭제
api.delete('/', 
		verifyToken,
		[
			check("basketUIDList", "basketUIDList is required").not().isEmpty()
		],
        function (req, res, next) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
				var basketUIDList = req.body.basketUIDList;

				var sql = "delete from my_basket where UID in (?);";
				var datas = [];
				for(var i in basketUIDList){
					datas.push(basketUIDList[i]);
				}

				const exect = db.query(sql, [datas], function (err, result) {
					if (err) throw err;

					res.status(200).json({status:200, data: "true", message:"success"});
				});

				console.log(exect.sql);
			}
        }
);

module.exports = api;