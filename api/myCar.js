const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');
const axios = require('axios');

api.post('/',
    [
        check("carNo", "carNo is required").not().isEmpty(),
    ],
    async function (req, res) {
        const error = getError(req, res);
        if (error.isEmpty()){
            try {
                const carNo = req.body.carNo;

                const [result] = await carData(carNo);

                if(result.length == 0){
                    res.status(403).json({
                        status: 403,
                        data : "false",
                        message : "차량정보 호출에 실패하였습니다. 다시 시도하세요."
                    })
                } else {
                    res.status(200).json({
                        status : 200,
                        data : result,
                        message : "success"
                    })
                }

            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
)

async function carData (carNo) {
    const result = await axios({
        url : 'http://interface.autoup.net/TrieFly.aspx?car_no=' + carNo,
        method : "post",
        headers: {
            "Content-Type": "application/json"
        },
    })

    return result.BaseInfo;
}


module.exports = api;