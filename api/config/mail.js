const nodemailer = require('nodemailer');
const {authUser} = require('./account.js');
const {authPass} = require('./account.js');
const ejs = require('ejs');
const path = require('path');

exports.sendMail = (toEmail, subject, html) => {
    const fromEmail = "타이어플라이 개발서버 메일 테스트 <test@tirefly.com>";

	// 메일 서명
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

// 회원가입 메일
exports.sendJoinMail = async (toEmail) => {
	const subject = "[타이어플라이] 회원가입 완료 안내";	
	const data = await ejs.renderFile(path.join('..', 'tirefly-server', 'views', 'join_mail.ejs'));
	this.sendMail(toEmail, subject, data); 
}

// 인증번호 전송 메일
exports.sendCertifyNoMail = async (toEmail, certifyNo) => {
	const subject = "[타이어플라이] 인증번호 안내";
    const data = await ejs.renderFile(path.join('..', 'tirefly-server', 'views', 'change_passwd_mail.ejs'), {certifyNo: certifyNo});
	this.sendMail(toEmail, subject, data);
}


// 비밀번호 변경 메일
exports.sendPasswdMail = async (toEmail, key) => {
	const subject = "[타이어플라이] 비밀번호 재설정 안내";
    const data = await ejs.renderFile(path.join('..', 'tirefly-server', 'views', 'change_passwd_mail.ejs'), {key: key});
	this.sendMail(toEmail, subject, data);
}

// 관리자에게 문의 메일 전달
exports.sendInquiryMail = (type, title, name, email, group, cellNumber, contents) => {	
	var html = '<div style="color: black;">'
			 + '<br><br>'
			 + '<img src="https://api.motifme.io/files/motif_logo.png"><br><br>'
			 + '<br>'
			 + '<div style="font-size:14px;">'
			 + `<b>문의 타입 : </b> <span> ${type} </span> <br>`
			 + '<br>'
			 + `<b>문의 제목 : </b> <span> ${title} </span> <br>`
			 + '<br>'
			 + `<b>성함 : </b> <span> ${name} </span> <br>`
			 + '<br>'
			 + `<b>이메일 : </b> <span> ${email} </span> <br>`
			 + '<br>'
			 + `<b>문의 내용 : </b> <span> ${contents} </span> <br>`
			 + '<br>';
	if(type == "제휴")
		html += `<b>소속 : </b> <span> ${group} </span> <br>`
			 + '<br>'
			 + `<b>전화번호 : </b> <span> ${cellNumber} </span> <br>`
			 + '<br>'
	html += '</div>'
		 + '</div>';
	var hlabEmail = "support@motifme.io";
	var subject = "[문의 - " + type + "] " + title;
	this.sendMail(hlabEmail, subject, html);
}

// 문의 답변 메일
exports.sendAnswerMail = (email, completeMsg) => {	
	var html = '<div style="color: black;">'
			 + '<pre>'
			 + completeMsg
			 + '</pre>'
			 + '</div>';
	var subject = "[타이어플라이] 문의 답변";
	this.sendMail(email, subject, html);
}