const express = require('express');
const { con } = require('./config/database.js');
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
        async function (req, res, next) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const productUID = req.params.productUID;
                    const basketList = req.body.basketList;

                    var sql = "insert my_basket(userUID, productUID, optionUID, count) values ?;";
                    var sqlData = [];
                    for(var i in basketList){
                        var userUID = basketList[i].userUID;
                        var optionUID = basketList[i].optionUID;
                        var count = basketList[i].count;
                        sqlData.push([userUID, productUID, optionUID, count]);
                    }
                    
                    await con.query(sql, [sqlData]);

                    res.status(200).json({status:200, data: "true", message:"success"});
                } catch (err) {
                    throw err;
                }
			}
        }
);

// 장바구니 조회
api.get('/:userUID', 
		verifyToken,
        async function (req, res, next) {
            try{
                const userUID = req.params.userUID;
                var sql = "select a.UID as myBasketUID, a.productUID, d.imgPath, b.korName, b.engName, b.originPrice, b.discountRate, b.discountPrice, "
                        + "b.shippingFee, c.optionName, a.count "
                        + "from my_basket a "
                        + "join product b on a.productUID = b.UID "
                        + "join product_option_list c on a.optionUID = c.UID "
                        + "join product_img_list d on d.productUID = b.UID "
                        + "where a.userUID = ? "
                        + "group by a.UID "
                        + "order by a.regDate desc";

                const [result] = await con.query(sql, userUID);

				res.status(200).json({status:200, data: result, message:"success"});
			} catch (err) {
                throw err;
            }
        }
);

// 장바구니 배열 삭제
api.delete('/', 
		verifyToken,
		[
			check("basketUIDList", "basketUIDList is required").not().isEmpty()
		],
        async function (req, res, next) {
			const errors = getError(req, res);
			if(errors.isEmpty()){
                try{
                    const basketUIDList = req.body.basketUIDList;

                    var sql = "delete from my_basket where UID in (?);";
                    var sqlData = [];
                    for(var i in basketUIDList){
                        sqlData.push(basketUIDList[i]);
                    }

                    await con.query(sql, [sqlData]);

                    res.status(200).json({status:200, data: "true", message:"success"});
                } catch (err) {
                    throw err;
                }
			}
        }
);

module.exports = api;