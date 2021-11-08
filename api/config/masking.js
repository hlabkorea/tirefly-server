exports.maskEmail = (email) => {
	var emailLength = email.split('@')[0].length;
	if(emailLength > 2)
		emailLength -= 3;

	var domainLength = email.split('@')[1].split('.')[0].length - 1;
	if(domainLength > 1)
		domainLength -= 2;

    var emailReg = new RegExp('.(?=.{0,' + emailLength + '}@)', 'g');
    var emailRegResult = email.toString().replace(emailReg, '*');

    var domainReg = new RegExp('.(?=.{0,'+ domainLength + '}\\.)', 'g');
    var result = emailRegResult.replace(domainReg, '*');

    return result;
}