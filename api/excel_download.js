const express = require('express');
const db = require('./config/database.js');
const api = express.Router();
const xl = require('excel4node');

//엑셀 다운로드
api.get('/', async function (req, res) {
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

    // 샘플 코드
    /*
    ws.cell(1, 1).string('일련번호').style(style);
    ws.cell(1, 2).string('입고일').style(style);
    ws.cell(2,1).string('MM-21120001-02');
    ws.cell(2,2).string('2021-12-09');
    ws.cell(3,1).string('MM-21120002-01');
    ws.cell(3,2).string('2021-12-10');

    wb.write('inventory_sample.xlsx', res);
    */

    // 데이터 코드
    /*  
    ws.cell(1, 1).string('일련번호').style(style);
    ws.cell(1, 2).string('입고일').style(style);
    ws.cell(1, 3).string('수령인').style(style);
    ws.cell(1, 4).string('전화번호').style(style);
    ws.cell(1, 5).string('출고일').style(style);
    ws.cell(1, 6).string('재고 상태').style(style);

    var result = [
        {
            serialNo: 'MM-21120001-02',
            recvDate: '2021-12-09',
            name: '',
            cellNumber: '',
            shipDate: '',
            stts:  '입고'
        },
        {
            serialNo: 'MM-21120002-01',
            recvDate: '2021-12-09',
            name: '홍길동',
            cellNumber: '010-0000-0000',
            shipDate: '2021-12-10',
            stts:  '출고'
        }
    ];

    for(var i in result){
        var row = Number(i)+2;
        ws.cell(row, 1).string(result[i].serialNo);
        ws.cell(row, 2).string(result[i].recvDate);
        ws.cell(row, 3).string(result[i].name);
        ws.cell(row, 4).string(result[i].cellNumber);
        ws.cell(row, 5).string(result[i].shipDate);
        ws.cell(row, 6).string(result[i].stts);
    }

    wb.write('inventory_list.xlsx', res);
    */
});

module.exports = api;