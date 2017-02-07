var ICHIMOKU = (function () {

	// PRIVATE FUNCTIONS
	var formatDate = function (date) {
		var d = date,
			month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear();

		if (month.length < 2) month = '0' + month;
		if (day.length < 2) day = '0' + day;

		return [year, month, day].join('-');
	};
	
	var getPastDay = function (fromDate, days) {
		var count = 0;
		while (count < days) {
			fromDate.setDate(fromDate.getDate() - 1);
			if (fromDate.getDay() != 0 && fromDate.getDay() != 6) // Skip weekends
				count++;
		}
		return formatDate(fromDate);
	};

	// PUBLIC FUNCTIONS
	return {

		//		getPeriod: function (arrData, period) {
		//			var periods = arrData.slice(period);
		//			return periods;
		//		},

		buildPeriod: function (fromDate, days) {
			var counter = 0, 
					arr = [],
					backtrack = days,
					day;
			
			while (counter < days) {
				var date = new Date(fromDate);
				day = getPastDay(date, backtrack);
				arr.push(day);
				counter++;
				backtrack--;
			}
			return arr;
		}


	};

})();