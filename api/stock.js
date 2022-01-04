const express = require('express');
const db = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { upload } = require('./config/uploadFile.js');
const api = express.Router();
const { check } = require('express-validator');
const { getError } = require('./config/requestError.js');
const xl = require('excel4node');

//악세사리 조회
api.get('/', async function (req, res) {
    var type = req.query.type ? req.query.type : '';
    var sql = "select UID, accName, imgPath, actImgPath, rectImgPath, status from acc ";
    if (type != "cms")
        sql += "where status = 'act'";
    db.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

// cms - 엑셀 양식 다운로드
api.get('/excel/sample', function (req, res) {
    var wb = new xl.Workbook({
        defaultFont: {
            color: '#000000',
            size: 12
        }
    });
    var ws = wb.addWorksheet('Sheet 1');

    var style = wb.createStyle({
        font: {
            bold: true
        },
        alignment: {
            horizontal: 'center'
        }
    });

    ws.column(1).setWidth(20);
    ws.column(2).setWidth(12);
    ws.row(1).setHeight(15);

    ws.cell(1, 1).string('일련번호').style(style);
    ws.cell(1, 2).string('검사일자').style(style);
    ws.cell(2,1).string('MM-21120001-02');
    ws.cell(2,2).string('2021-12-09');

    wb.write('stock_sample.xlsx', res);
});

api.get('/excel', function (req, res) {
    var accUID = req.params.accUID;
    var sql = "select accName, imgPath, actImgPath, rectImgPath, status from acc where UID = ?";
    db.query(sql, accUID, function (err, result) {
        if (err) throw err;

        var wb = new xl.Workbook({
            defaultFont: {
                color: '#000000',
                size: 12
            }
        });
        var ws = wb.addWorksheet('Sheet 1');
    
        var style = wb.createStyle({
            font: {
                bold: true
            },
            alignment: {
                horizontal: 'center'
            }
        });
    
        ws.column(1).setWidth(20);
        ws.column(2).setWidth(12);
        ws.row(1).setHeight(15);

        ws.cell(1, 1).string('일련번호').style(style);
        ws.cell(1, 2).string('검사일자').style(style);
        ws.cell(1, 3).string('수령인').style(style);
        ws.cell(1, 4).string('전화번호').style(style);
        ws.cell(1, 5).string('출고일').style(style);
        ws.cell(1, 6).string('재고 상태').style(style);

        res.status(200).json({
            status: 200,
            data: result,
            message: "success"
        });
    });
});

module.exports = api;