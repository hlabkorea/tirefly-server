//Mysql connect
const mysql = require('mysql'); // callback 형식 -> async await 사용 불가능

var con2 = mysql.createConnection({
	connectionLimit : 10,
	host : 'kr-cdb-cxm16ku6.sql.tencentcdb.com',
	port : '63934',
	user : 'hlab_dev',
	password : 'hlab0901',
	database : 'motif',
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
	host : 'kr-cdb-cxm16ku6.sql.tencentcdb.com',
	port : '63934',
	user : 'hlab_dev',
	password : 'hlab0901',
    database : 'motif',
	multipleStatements: true, // 다중 쿼리 가능
	dateStrings: true // Date 형식 변형 X (ex) 2020-08-09T08:11:31.OOOZ -> 2020-08-09 08:11:31)
});

module.exports.con = con;

var devcon = mysql2.createPool({
	connectionLimit : 10,
	host : 'kr-cdb-cxm16ku6.sql.tencentcdb.com',
	port : '63934',
	user : 'hlab_dev',
	password : 'hlab0901',
    database : 'motif',
	multipleStatements: true, // 다중 쿼리 가능
	dateStrings: true // Date 형식 변형 X (ex) 2020-08-09T08:11:31.OOOZ -> 2020-08-09 08:11:31)
});

module.exports.devcon = con;