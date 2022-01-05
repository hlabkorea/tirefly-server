const express = require('express');
const db = require('./config/database.js');
const { verifyAdminToken } = require("./config/authCheck.js");
const { memoryUpload } = require('./config/uploadFile.js');
const api = express.Router();
const { getPageInfo } = require('./config/paging.js'); 
const xl = require('excel4node');
const excelToJson = require('convert-excel-to-json');
const { addSearchSql } = require('./config/searchSql.js');
const pageCnt15 = 15;

// 재고 전체 조회
api.get('/', verifyAdminToken, async function (req, res) {
    var searchType = req.query.searchType ? req.query.searchType : '';
    var searchWord = req.query.searchWord ? req.query.searchWord : '';
    var sql = "select stock.UID as stockUID, stock.serialNo, stock.testDate, ifnull(payment.shipRcpnt, '-') as shipRcpnt, ifnull(payment.buyerTel, '-') as buyerTel, "
            + "stock.regDate, ifnull(payment.shipConfDate, '-') as shipConfDate, if(stock.paymentUID = 0, '입고', '출고') as stockState "
            + "from stock "
            + "left join payment on stock.paymentUID = payment.UID ";
        
    sql += addSearchSql(searchType, searchWord);
    var countSql = sql + ";";

    sql += "order by stock.regDate desc, stock.UID desc ";
    sql += " limit ?, " + pageCnt15;
    var currentPage = req.query.page ? parseInt(req.query.page) : 1;
    var data = (parseInt(currentPage) - 1) * pageCnt15;
    
    db.query(countSql+sql, data, function (err, result) {
        if (err) throw err;
        
        var {startPage, endPage, totalPage} = getPageInfo(currentPage, result[0].length, pageCnt15);
        res.status(200).json({status:200, 
                  data: {
                    paging: {startPage: startPage, endPage: endPage, totalPage: totalPage},
                    result: result[1]
                  }, 
                  message:"success"});
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
    ws.cell(1, 2).string('검사일').style(style);
    ws.cell(2,1).string('MM-21120001-02');
    ws.cell(2,2).string('2021-12-09');

    wb.write('stock_sample.xlsx', res);
});

api.get('/excel', function (req, res) {
    var accUID = req.params.accUID;
    var sql = "select * from stock";
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
        ws.cell(1, 2).string('검사일').style(style);
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

api.post('/excel', memoryUpload.single('file'), function (req, res) {
    // 엑셀 데이터 json으로 변환
    const result = excelToJson({
        source: req.file.buffer
    });

    const sample = result['Sheet 1'];
    var data = [];

    for(var i = 1; i < sample.length; i++){
        var serialNo = sample[i].A;
        var testDate = sample[i].B;
        data.push([serialNo, testDate]);
    }

    var sql = "insert stock(serialNo, testDate) values ?;";

    db.query(sql, [data], function (err, result, fields) {
        if (err) throw err;

        res.status(200).send({
            status: 200,
            data: "true",
            message: "success"
        });
    });
});

module.exports = api;