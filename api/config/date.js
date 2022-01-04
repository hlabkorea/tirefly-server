exports.getCurrentDateTime = () => {
	var currentDateTime = new Date(Date.now());

	return this.toHypenDateFormat(currentDateTime);
}

exports.getNextDateTime = (laterNum) => {
	var date = new Date();
	let nextDate = date.setMonth(date.getMonth() + laterNum); // unix timestamp로 나타내기 위해 1000 나눔
	nextDate = date.setHours(13);
	nextDate = date.setMinutes(0) / 1000;

	return nextDate;
}