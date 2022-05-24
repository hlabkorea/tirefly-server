const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');


// 내 쿠폰 리스트
api.get('/',
    verifyToken,
    async function (req, res) {
        try {
            const userUID = req.userUID;

            var sql = "select a.UID as UID, name, couponNo, dcType, dcAmount, b.endDate, b.minLimit, b.maxLimit from myCoupon a join "
            +"coupon b on b.UID = a.couponUID "
            +"where a.userUID = ? and b.endDate >= now() "
            +"order by a.regDate desc"
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

// 내 쿠폰 등록
api.post('/',
    verifyToken,
    [
        check("couponNo", "couponNo is required").not().isEmpty(),
    ],
    async function (req, res) {
        const error = getError(req, res)
        if (error.isEmpty()){
            try {
                const couponNo = req.body.couponNo;
                const userUID = req.userUID;
                const regDate = new Date();
                
                
                var findCouponSql = "select * from coupon where couponNo = ?"
                const [findCouponResult] = await con.query(findCouponSql, couponNo);


                if(findCouponResult.length == 0){
                    res.status(403).json({
                        status : 403,
                        data : "false",
                        message : "존재하지 않는 쿠폰입니다. 쿠폰번호를 다시 확인하십시오."
                    })
                } else {

                    const couponUID = findCouponResult[0].UID

                    var overlapCouponSql = "select * from myCoupon where userUID = ? and couponUID = ?"
                    const overlapCouponSqlData = [userUID, couponUID] 
                    const [overlapCoupon] = await con.query(overlapCouponSql, overlapCouponSqlData);

                    if(overlapCoupon.length > 0) {
                        res.status(403).json({
                            status : 403,
                            data : "false",
                            message : "이미 등록된 쿠폰입니다."
                        })
                    } else {
                        var sql = "insert myCoupon(couponUID, userUID, regDate, regUser, used) values(?)";
                        const sqlData = [couponUID, userUID, regDate, userUID, 0];
        
                        const [result] = await con.query(sql, [sqlData]);
        
                        res.status(200).json({
                            status : 200,
                            data : "true",
                            mesaage : "쿠폰 등록이 완료 되었습니다."
                        })
                    }
                }
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
)


module.exports = api;