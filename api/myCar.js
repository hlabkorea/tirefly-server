const express = require('express');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const { con } = require('./config/database.js');
const { verifyToken } = require('./config/authCheck.js');
const axios = require('axios');

// 차량 정보 등록
api.post('/',
    verifyToken,
    [
        check("carNo", "carNo is required").not().isEmpty(),
        check("carNick", "carNick is required").not().isEmpty(),
        check("mnfctUID", "mnfctUID is required").exists(),
        check("modelUID", "modelUID is required").exists(),
    ],
    async function (req, res) {
        const error = getError(req, res);
        if (error.isEmpty()){
            try {
                console.log('here');
                const userUID = req.userUID;
                const carNo = req.body.carNo;
                const carNick = req.body.carNick;
                const mnfctUID = Number(req.body.mnfctUID ? req.body.mnfctUID : 0);
                const modelUID = Number(req.body.modelUID ? req.body.modelUID : 0);
                const regDate = new Date();

                const result = await axios({
                    url : 'http://interface.autoup.net/TireFly.aspx?car_no=' + encodeURI(carNo),
                    method : "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                })
                console.log('result ::' , result);

                const [carInfo] = result.data.BaseInfo;

                console.log('carInfo :: ', typeof(carInfo.return_msg))``

                if(carInfo.return_msg == '201'){
                    res.status(403).json({
                        status: 403,
                        data : "false",
                        message : "차량정보가 없습니다. 차량정보를 다시 확인하세요."
                    })
                    return false
                } 
                    console.log('pass')
                    var overlapMyCarSql = "select * from myCar where carNo = ?"
                    const [overlapMyCarResult] = await con.query(overlapMyCarSql, carNo);
                    
                    if(overlapMyCarResult.length > 0) {
                        res.status(403).json({
                            status : 403,
                            data : "false",
                            message : "이미 등록이 완료된 차량입니다."
                        })
                    } else {
                        const companyName = carInfo.CompanyName ? carInfo.CompanyName : '';
                        const modelName = carInfo.ModelName ? carInfo.ModelName : '';
                        const gradeName = carInfo.GradeName ? carInfo.GradeName : '';
                        const subGradeName= carInfo.SubGradeName ? carInfo.SubGradeName : '';
    
                        const carFullName = companyName + " " + modelName + " " + gradeName + " " + subGradeName
                        const tireSize = carInfo.Tire ? carInfo.Tire : "";
    
                        // console.log("userUID :: ",typeof(userUID));
                        // console.log("carNick :: ",typeof(carNick));
                        // console.log("carFullName :: ",typeof(carFullName));
                        // console.log("carNo :: ",typeof(carNo));
                        // console.log("tireSize :: ",typeof(tireSize));
                        // console.log("mnfctUID :: ",typeof(mnfctUID));
                        // console.log("modelUID :: ",typeof(modelUID));
                        // console.log("regDate :: ",typeof(regDate));
                        var sql = "insert myCar(userUID, carNick, carFullName, carNo, tireSize, mnfctUID, modelUID, regDate, `default`) values (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    
                        const sqlData = [userUID, carNick, carFullName, carNo, tireSize, mnfctUID, modelUID, regDate, 0]
                        
                        await con.query(sql, sqlData);
    
    
                        res.status(200).json({
                            status : 200,
                            data : "true",
                            message : "차량 정보 등록에 성공하였습니다!"
                        })
                    }
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
)


// 내 차량 리스트 조회
api.get('/',
    verifyToken,
    async function (req, res){
        const userUID = req.userUID;

        var sql = "select a.UID, carNick, carFullName, carNo, tireSize, b.name as mnfctName, c.name as modelName from myCar a join mnfct b on a.mnfctUID = b.UID join model c on a.modelUID = c.UID where userUID = ?"
        const [result] = await con.query(sql, userUID);
        console.log('123')
        res.status(200).json({
            status : 200,
            data : result,
            message : "success"
        })
    }
)

// 대표 차량 선택
api.post('/defaultCar/:myCarUID',
    verifyToken,
    async function (req, res) {
        const error = getError(req, res);
        if(error.isEmpty()){
            try {
                const userUID = req.userUID;
                const myCarUID = req.params.myCarUID;
                const dateTime = new Date()

                const checkDefaultSql = "select `default` from myCar where userUID = ? and UID = ?";
                const checkDefaultSqlData = [userUID, myCarUID];
                const [checkDefaultData] = await con.query(checkDefaultSql,checkDefaultSqlData)

                if(checkDefaultData[0].default !== 0){
                    var sql = 'update myCar set `default` = 0, updateDate = ? where userUID = ? and UID = ?'
                    const sqlData = [dateTime, userUID, myCarUID];

                    await con.query(sql,sqlData);
                    res.status(200).json({
                        status: 200,
                        data : "true",
                        message : "대표차량에서 해지 되었습니다."
                    })
                } else {
                    var sql = 'update myCar set `default` = 1, updateDate = ? where userUID = ? and UID = ?'
                    const sqlData = [dateTime, userUID, myCarUID];

                    await con.query(sql,sqlData);
                    res.status(200).json({
                        status: 200,
                        data : "true",
                        message : "대표차량으로 등록 되었습니다."
                    })
                }
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    }
)

// 차량 정보 삭제
api.delete('/:myCarUID',
    verifyToken,
    async function (req, res) {
        try {
            const myCarUID = req.params.myCarUID;
            var sql = "delete from myCar where UID = ?";
            await con.query(sql, myCarUID);
            res.status(200).json({
                status : 200,
                data : "true",
                message : "success"
            })
        } catch (err) {
            console.log(err);
            throw err;
        }
    }
)




module.exports = api;