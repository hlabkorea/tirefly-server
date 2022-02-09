const express = require('express');
const { con } = require('./config/database.js');
const api = express.Router();

// 상품 전체 조회
api.get('/',
    async function (req, res, next) {
        try{
            const category = req.query.category ? req.query.category : '';
            var sql = "select a.UID, ifnull(b.imgPath, '') imgPath, a.korName, a.engName, a.originPrice, a.discountRate, a.discountPrice, a.dcShippingFee as shippingFee " +
                "from product a " +
                "left join product_img_list b on a.UID = b.productUID " + 
                "where a.status='act' ";

            if(category != 'membership')
                sql += "and a.category != 'membership' ";

            if (category.length != 0) 
                sql += `and a.category = '${category}' `;

            sql += "group by a.UID " +
                "order by b.UID ";

            console.log(sql);

            const [result] = await con.query(sql);

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

// 상품 상세정보 조회
api.get('/:productUID',
    async function (req, res, next) {
        try{
            const productUID = req.params.productUID;
            var sql = "select UID, korName, engName, originPrice, discountRate, discountPrice, originShippingFee, dcShippingFee, " +
                "ifnull(composition, '') as composition, ifnull(benefitInfo, '') as benefitInfo, ifnull(shippingInfo, '') as shippingInfo, detailImgPath, detailMobileImgPath " +
                "from product " +
                "where UID = ?";
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