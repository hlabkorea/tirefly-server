const express = require('express');
const db = require('./config/database.js');
const api = express.Router();

// 상품 리스트 조회
api.get('/', 
        function (req, res, next) {
			var category = req.query.category;
			var sql = "select product.UID, product_img_list.imgPath, korName, engName, originPrice, discountRate, discountPrice, dcShippingFee as shippingFee "
					+ "from product "
					+ "join product_img_list on product.UID = product_img_list.productUID "
					+ "where status='ACT' ";

			if(category != undefined){
				if(category.length != 0){
					sql += "and category = ? ";
				}
			}
			
			sql += "group by product.UID " 
				 + "order by product_img_list.UID ";

			db.query(sql, category, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: result, message:"success"});
			});
        }
);

// 상품 정보 조회
api.get('/:productUID', 
        function (req, res, next) {
			var productUID = req.params.productUID;
			var sql = "select product.UID, korName, engName, originPrice, discountRate, discountPrice, originShippingFee, dcShippingFee, composition, benefitInfo, shippingInfo, detailImgPath, detailMobileImgPath "
					+ "from product "
					+ "join product_img_list on product.UID = product_img_list.productUID "
					+ "where product.UID = ?"
					+ "order by product_img_list.UID "
					+ "limit 1";

			db.query(sql, productUID, function (err, result) {
				if (err) throw err;

				res.status(200).json({status:200, data: result, message:"success"});
			});
        }
);

module.exports = api;