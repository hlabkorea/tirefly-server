const nodemailer = require('nodemailer');
const {authUser} = require('./account.js');
const {authPass} = require('./account.js');
const ejs = require('ejs');
const path = require('path');

exports.sendMail = (toEmail, subject, html) => {
    const fromEmail = "모티프 고객센터 <support@motifme.io>";

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
	const subject = "[모티프] 회원가입 완료 안내";
	var html = '<div style="color:#111;font-size:10pt;line-height:1.5;text-align:center"><p><br></p><p><br></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<img src="https://api.motifme.io/files/motif_logo.png"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<b><span style="font-size:13.5pt;line-height:19.26px;color:black">회원가입이 완료되었습니다.</span></b><br><br>'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">모티퍼가 되신 것을 환영합니다.</span></p>'
			 + '<p><span style="font-size:9pt;line-height:12.84px;color:black">모티프와 함께 새로운 홈트레이닝 서비스를 경험해보세요!</span></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;lbackground-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<a href="https://www.motifme.io" style="background-color: black; color: white; font-size: 20px; text-align: center; text-decoration: none; border-radius: 10px; width: 252px; height: 59px; padding: 15px 45px"> 모티프 홈페이지로 </a>'
			 + '</div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">회원님의 정보는 철저한 보안 아래 안전하게 유지됩니다.</span></p>'
			 + '</div>';
	this.sendMail(toEmail, subject, html);	
    /*const data = await ejs.renderFile(path.join('..', 'motif-server', 'views', 'join_mail.ejs'));
	this.sendMail(toEmail, subject, data); */
}

// 비밀번호 변경 메일
exports.sendPasswdMail = async (toEmail, key) => {
	const subject = "[모티프] 비밀번호 재설정 안내";
	var html = '<div style="color:#111;font-size:10pt;line-height:1.5"><p><br></p><p><br></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<img src="https://api.motifme.io/files/motif_logo.png"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<b><span style="font-size:13.5pt;line-height:19.26px;color:black">비밀번호 재설정</span></b><br><br>'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">아래 버튼을 클릭하시면 비밀번호를 재설정 할 수 있습니다<span lang="EN-US">.</span></span></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;lbackground-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<span lang="EN-US" style="font-size:9pt;line-height:12.84px;color:black"> </span></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + `<a href="https://motifme.io/user/new_pw.html?auth=${key}" style="background-color: black; color: white; font-size: 20px; text-align: center; text-decoration: none; border-radius: 10px; width: 252px; height: 59px; padding: 15px 45px"> 비밀번호 재설정 </a>`
			 + '</div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">해당 링크는<span> </span><span lang="EN-US">24</span>시간 동안 유효합니다<span lang="EN-US">.</span></span></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">새로운 비밀번호 설정을 원하지 않는 경우에는 해당 메일은 무시하시면 됩니다</span></p></div>';
			 
	this.sendMail(toEmail, subject, html);
    /*const data = await ejs.renderFile(path.join('..', 'motif-server', 'views', 'change_passwd_mail.ejs'), {key: key});
	this.sendMail(toEmail, subject, data);*/
}

// 미러 구매 메일
exports.sendPaymentMail = async (result, email) => {
	const subject = "[모티프] 모티프 미러 주문 완료 안내";
	/*const productName = result[0].korName;
	const merchantUid = result[0].merchantUid;
	const discountPrice = result[0].discountPrice;
	const paymentPrice = comma(result[0].amount);
	const dcShippingFee = result[0].dcShippingFee;
	var shippingFee = "";
	if(dcShippingFee == 0)
		shippingFee = "FREE";*/

	const productImg = "https://api.motifme.io/files/" + result[0].imgPath;
	const productName = result[0].korName;
	var productPrice = result[0].originPrice;
	const discountPrice = result[0].discountPrice;
	var difference = comma(productPrice - discountPrice);
	productPrice = comma(productPrice);
	const merchantUid = result[0].merchantUid;
	const paymentPrice = comma(result[0].amount);
	const originShippingFee = comma(result[0].originShippingFee);
	const dcShippingFee = result[0].dcShippingFee;
	var shippingFee = "";
	if(dcShippingFee == 0)
	shippingFee = "FREE";
	const leftCol = '25%';
	const centerCol = '50%';
	const rightCol = '25%';

	var html = '<div style="color:#111;font-size:10pt;line-height:1.5;text-align:center"><p><br></p><p><br></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<img src="https://api.motifme.io/files/motif_logo.png"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<b><span style="font-size:13.5pt;line-height:19.26px;color:black">모티프 미러를 구매해주셔서 감사합니다.</span></b><br><br></p>'
			 + `<p><span style="font-size:9pt;line-height:12.84px;color:black">주문번호: ${merchantUid}</span></p>`
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<table cellspacing="0" cellpadding="0" border="1" style="margin-left: auto; margin-right: auto; border-color: #E0E0E0; width: 500px;">'
			 + `<col width="${leftCol}" />`
			 + `<col width="${centerCol}" />`
			 + `<col width="${rightCol}" />`
			 + '<tr>'
			 + `<td width="72" style="padding: 5px"><img src="${productImg}" style="display: block; width: 100%; margin: 0px auto;"></td>`
			 + `<td width="127">${productName}<br /></td>`
			 + `<td width="72" style="text-align: right">${productPrice}원</td>`
			 + '</tr>'
			 + '<tr>'
			 + '<td style="height: 35px">&nbsp;</td>'
			 + '<td style="height: 35px"></td>'
			 + '<td style="height: 35px"></td>'
			 + '</tr>'
			 + '<tr>'
			 + '<td colspan="3">'
			 + '<table cellspacing="0" cellpadding="0" width="100%" style="text-align: center; color: black">'
			 + `<col width="${leftCol}" />`
			 + `<col width="${centerCol}" />`
			 + `<col width="${rightCol}" />`
			 + '<tr>'
			 + '<td style="height: 35px">할인 적용</td>'
			 + '<td style="height: 35px"></td>'
			 + `<td style="text-align: right; height: 35px">-${difference}원</td>`
			 + '</tr>'
			 + '<tr>'
			 + '<td style="height: 35px">배송비</td>'
			 + `<td style="text-align: right; height: 35px;">${shippingFee}</td>`
			 + `<td style="text-align: right; text-decoration:line-through; height: 35px">${originShippingFee}원</td>`
			 + '</tr>'
			 + '<tr>'
			 + '<td style="height: 35px">결제 금액</td>'
			 + '<td style="height: 35px"></td>'
			 + `<td style="text-align: right; height: 35px">${paymentPrice}원</td>`
			 + '</tr>'
			 + '</table>'
			 + '</td>'
			 + '</tr>'
			 + '</table>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
             + '<b><span style="font-size:9pt;line-height:12.84px;color:black">'
             + '배송 정보 안내</span></b>'
             + '<p><span style="font-size:9pt;line-height:12.84px;color:black">'
             + '모티프 미러 주문 시 입력하신 연락처로 영업일 기준 3일 이내 배송 일정 안내를 위한 해피콜을 드릴 예정입니다.'
             + '</span></p>'
             + '<p><span style="font-size:9pt;line-height:12.84px;color:black">'
             + '모티프 미러 배송은 수도권 (서울, 경기) 내 무료 배송, 그 외 지역은 5만원의 추가 비용이 청구됩니다. (단, 제주 및 도서산간 지역 제외)'
             + '</span></p>'
             + '<p><span style="font-size:9pt;line-height:12.84px;color:black">'
             + '배송과 관련하여 문의사항이 있는 경우에는 고객센터(<a href="mailto:support@motifme.io">support@motifme.io</a>)로 문의 바랍니다.'
             + '</span></p>'
			 + '</div>';

	this.sendMail(email, subject, html);

	/*
	const ejsData = {
		merchantUid: merchantUid,
		productName: productName,
		discountPrice: discountPrice,
		paymentPrice: paymentPrice,
		shippingFee: shippingFee,
		paymentPrice: paymentPrice
	}
	const data = await ejs.renderFile(path.join('..', 'motif-server', 'views', 'payment_mail.ejs'), ejsData);
	this.sendMail(email, subject, data);*/
}

function comma(str) {
    str = String(str);
    return str.replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
}

// 맴버십 구매 메일
exports.sendMembershipEmail = async (email, level, amount, payMethod, cardNumber) => {	
	amount = comma(amount);
	cardNumber = cardNumber.replace(/([0-9]{4})([0-9*]{4})([0-9*]{4})([0-9*]{4})/,"$1-$2-$3-$3");
	var html = '<div style="color:#111;font-size:10pt;line-height:1.5;text-align:center"><p><br></p><p><br></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<img src="https://api.motifme.io/files/motif_logo.png"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<b><span style="font-size:13.5pt;line-height:19.26px;color:black">모티프 멤버십을 구독해주셔서 감사합니다.</span></b><br><br></p>'
			 + `<p><span style="font-size:9pt;line-height:12.84px;color:black">계정 정보 : ${email}</span></p>`
			 + '<p><span style="font-size:9pt;line-height:12.84px;color:black">서비스 제공 업체 : 주식회사 에이치랩</span></p>'
			 + `<p><span style="font-size:9pt;line-height:12.84px;color:black">구독 멤버십 : ${level}</span></p>`
			 + `<p><span style="font-size:9pt;line-height:12.84px;color:black">멤버십 요금 : 월 ${amount}원(VAT 포함)</span></p>`
			 + `<p><span style="font-size:9pt;line-height:12.84px;color:black">결제수단 : ${payMethod} ${cardNumber}</span></p>`
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;lbackground-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<i><span lang="EN-US" style="font-size:9pt;line-height:12.84px;color:black"></span></i></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">결제하신 멤버십에 대한 자세한 내용은 홈페이지 내 마이페이지에서 확인 가능합니다.</span></p>'
			 + '</div>';
	var subject = "[모티프] 모티프 멤버십 구독 완료 안내";
    this.sendMail(email, subject, html);
    
    /*const ejsData = {
		email: email,
		level: level,
		amount: amount
    }
	const data = await ejs.renderFile(path.join('..', 'motif-server', 'views', 'membership_mail.ejs'), ejsData);
	this.sendMail(email, subject, data);*/
}

// 멤버십 초대 메일
exports.sendInviteEmail = async (ownerEmail, userEmail) => {	
	const subject = "[모티프] 모티프 멤버십 초대 안내";
	var html = '<div style="color:#111;font-size:10pt;line-height:1.5;text-align:center"><p><br></p><p><br></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<img src="https://api.motifme.io/files/motif_logo.png"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<b><span style="font-size:13.5pt;line-height:19.26px;color:black">모티퍼 멤버십에 초대되신 것을 축하합니다.</span></b><br><br>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + `<b><span style="font-size:9pt;line-height:12.84px;color:black"> 초대 계정 : ${ownerEmail}</span></b></p>`
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<p><span style="font-size:9pt;line-height:12.84px;color:black">모티프가 제공하는 새로운 방식의 홈트레이닝 서비스를 시작하세요!</span></p>'
			 + '<p><span style="font-size:9pt;line-height:12.84px;color:black">지금 모티프 앱을 설치하시고 경험해보세요</span></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;lbackground-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px"></p>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255);text-align:center">'
			 + '<a href="https://www.apple.com/kr/app-store" target="_blank"><img src="https://api.motifme.io/files/apple_store_logo.png" style="width: 194px; height: 75px;"></a><br>'
			 + '</div>'
			 + '<div style="color:rgb(34,34,34);font-size:small;font-weight:400;background-color:rgb(255,255,255)text-align:center"><br></div>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<i><span lang="EN-US" style="font-size:9pt;line-height:12.84px;color:black"></span></i></p>'
			 + '<p align="center" style="margin:0cm 0cm 8pt;color:rgb(34,34,34);font-weight:400;background-color:rgb(255,255,255);font-size:10pt;text-align:center;line-height:14.2667px">'
			 + '<span style="font-size:9pt;line-height:12.84px;color:black">회원가입 시, 본 메일을 수신하신 이메일 계정을 사용해주세요.</span></p>'
			 + '</div>';
	this.sendMail(userEmail, subject, html);
    /*const data = await ejs.renderFile(path.join('..', 'motif-server', 'views', 'invite_mail.ejs'), {ownerEmail: ownerEmail});
	this.sendMail(userEmail, subject, data);*/
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
	var subject = "[모티프] 문의 답변";
	this.sendMail(email, subject, html);
}