const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');



api.get('/',
    verifyToken,
    async function (req, res) {
        try {
            const userUID = req.userUID;

            var sql = "select a.UID as UID, name, couponNo, dcType, dcAmount from myCoupon a join coupon b on b.UID = a.couponUID where userUID = ? order by a.regDate desc"
            const [result] = await con.query(sql, userUID);

            res.status(200).json({
                status : 200,
                data : result,
                message : "success",
            })
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
)

api.post('/addCoupon',
    verifyToken,
    [
        check("couponNo", "couponNo is required").not().isEmpty(),
    ],
    async function (req, res) {
        const error = getError(req, res)
        if (error.isEmpty()){
            try {
                const couponNo = req.body.couponNo;

                var findCouponSql = "select * from coupon where couponNo = ?"
                const [findCouponResult] = await con.query(findCouponSql, couponNo);

                const couponUID = findCouponResult[0].UID;
                const userUID = req.userUID;
                const regDate = new Date();

                if(findCouponResult.length == 0){
                    res.status(403).json({
                        status : 403,
                        data : "false",
                        message : "존재하지 않는 쿠폰입니다. 쿠폰번호를 다시 확인하십시오."
                    })
                } else {
                    var sql = "insert myCoupon(couponUID, userUID, regDate, regUser, used) values (?, ?, ?, ?, ?)";
                    const sqlData = [couponUID, userUID, regDate, userUID, 0];

                    const [result] = await con.query(sql, sqlData);

                    res.status(200).json({
                        status : 200,
                        data : "true",
                        mesaage : "쿠폰 등록이 완료 되었습니다."
                    })
                }
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
)


module.exports = api;