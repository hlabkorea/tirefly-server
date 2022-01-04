//Mysql connect
const mysql = require('mysql'); // callback 형식 -> async await 사용 불가능

var con = mysql.createConnection({
	connectionLimit : 10,
	host : 'kr-cdb-cxm16ku6.sql.tencentcdb.com',
	port : '63934',
	user : 'hlab_dev',
	password : 'hlab0901',
	database : 'motif',
    multipleStatements: true,
    dateStrings: true
});

con.connect(function(err) {
	if(!err){
        console.log("db connect!");
    }else{
        console.log("disconnect");
    }
});

module.exports = con;

/* mysql2 버전
const mysql2 = require('mysql2/promise');

var con2 = mysql2.createPool({
	connectionLimit : 10,
	host : 'kr-cdb-cxm16ku6.sql.tencentcdb.com',
	port : '63934',
	user : 'hlab_dev',
	password : 'hlab0901',
	database : 'motif'
});

module.exports.con2 = con2;
*/