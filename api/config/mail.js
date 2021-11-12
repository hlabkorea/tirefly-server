const nodemailer = require('nodemailer');
const {authUser} = require('./account.js');
const {authPass} = require('./account.js');
const path = require('path');

exports.sendMail = (toEmail, subject, html) => {
    const fromEmail = "모티프 고객센터 <support@motifme.io>";

	/*html += "<br><br><br><br><br>--"
		  + "<br><br>"
		  + '<p style="font-size: 12px; font-weight: bold"> 모티프 </p>'
		  + "<br><br>"
		  + '<div style="font-size:10px;">'
		  + '웹사이트: <a href="www.motifme.io"> www.motifme.io </a> |대표메일: support@motifme.io <br>'
		  + '(우) 41585 대구광역시 북구 호암로 51, 2층(메이커스페이스동, 침산동)';*/

    var mailOptions = {
        from: fromEmail,
        to: toEmail ,
        subject: subject,
		html: html
    };

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        host: "smtp.gamil.com",    //SMTP 서버 주소
        port: 587,
        secure: false,           //보안 서버 사용 false로 적용시 port 옵션 추가 필요
        requireTLS: false,
        auth: {
            user: authUser,     //메일서버 계정
            pass: authPass      //메일서버 비번
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    transporter.sendMail(mailOptions, function(err, info){
        if (err) throw err;

        transporter.close();
    });
}