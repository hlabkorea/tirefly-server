exports.toHypenDateFormat = (datatime) => {
	var year = datatime.getFullYear().toString();
	var month = (datatime.getMonth()+1).toString();
	if(month.length == 1)
		month = "0"+month;
	var day = datatime.getDate().toString();
	if(day.length == 1)
		day = "0"+day;
	return `${year}-${month}-${day}`;
}

exports.toHypenDateTimeFormat = (date) => {
	var year = date.getFullYear().toString();
	var month = (date.getMonth()+1).toString();
	if(month.length == 1)
		month = "0"+month;
	var day = date.getDate().toString();
	if(day.length == 1)
		day = "0"+day;

	var hour = (date.getHours()+1).toString();
	var minute = date.getMinutes().toString();
	var seconds = date.getSeconds();

	return `${year}-${month}-${day} ${hour}:${minute}:${seconds}`;
}

exports.toDotDateFormat = (datatime) => {
	var year = parseInt(datatime.getFullYear().toString())%100;
	var month = (datatime.getMonth()+1).toString();
	if(month.length == 1)
		month = "0"+month;
	var day = datatime.getDate().toString();
	if(day.length == 1)
		day = "0"+day;
	return `${year}.${month}.${day}`;
}