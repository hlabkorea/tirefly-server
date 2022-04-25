//Mysql connect
const mysql = require('mysql'); // callback 형식 -> async await 사용 불가능

var con2 = mysql.createConnection({
	connectionLimit : 10,
	host : 'ls-4676f18d60b10a0ac0e7200687b524f3e2d89dc9.cvf1oe9z3jmp.ap-northeast-2.rds.amazonaws.com',
	port : '3306',
	user : 'dbmasteruser',
	password : 'moove7800!!',
	database : 'tirefly',
    multipleStatements: true, // 다중 쿼리 가능
    dateStrings: true // Date 형식 변형 X (ex) 2020-08-09T08:11:31.OOOZ -> 2020-08-09 08:11:31)
});

con2.connect(function(err) {
	if(!err){
        console.log("db connect!");
    }else{
        console.log("disconnect");
    }
});

module.exports = con2;

//mysql2 버전
const mysql2 = require('mysql2/promise');
var con = mysql2.createPool({
	connectionLimit : 10,
	host : 'ls-4676f18d60b10a0ac0e7200687b524f3e2d89dc9.cvf1oe9z3jmp.ap-northeast-2.rds.amazonaws.com',
	port : '3306',
	user : 'dbmasteruser',
	password : 'moove7800!!',
    database : 'tirefly',
	multipleStatements: true, // 다중 쿼리 가능
	dateStrings: true // Date 형식 변형 X (ex) 2020-08-09T08:11:31.OOOZ -> 2020-08-09 08:11:31)
});

module.exports.con = con;
