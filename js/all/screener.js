var SCREENER = (function () {

	// ==========================================================================
	// PRIVATE
	// ==========================================================================

	// ==========================================================================
	// Method to get certain period of days
	// Params: (Array/Object) data from API,
	// 				 (Int) past number of days,
	// 				 (Int) offset number of days to start from counting (optional)
	// Return: (Array/Object) trimed period of days from API data
	// ==========================================================================
	function getPeriod (data, backtrack, offset) {
		var periods = data.slice(backtrack, offset);
		return periods;
	}

	// ==========================================================================
	// Method to get highest High of data
	// Params: (Array) array of High values from API data
	// Return: (Int/Float) highest High value
	// ==========================================================================
	function getHigh (arr) {
		var high = Math.max(...arr);
		return high;
	}

	// ==========================================================================
	// Method to get lowest Low of data
	// Params: (Array) array of Low values from API data
	// Return: (Int/Float) lowest Low value
	// ==========================================================================
	function getLow (arr) {
		var low = Math.min(...arr);
		return low;
	}

	// ==========================================================================
	// Method to get HLOC (High,Low,Open,Close) data
	// Params: (Object) data, (Int) backtrack, (Int) offset (optional)
	// Return: (Object) HLOC
	// ==========================================================================
	function getHLOC () {
			
		var data = arguments[0],
				backtrack = arguments[1],
				offset = arguments[2],
				periodArr,
				highArr = [],
				lowArr = [],
				highestHigh,
				lowestLow,
				high,
				low,
				open,
				close;
		
		// get only last N periods, add to array
		periodArr = getPeriod(data, backtrack, offset);
		
		// if greater than one day, get highest high and lowest low
		if (periodArr.length > 1) {
			
			periodArr.forEach(function (quote) {
				// get only the Highs and add to array
				highArr.push(quote.high);
				// get only the Lows and add to array
				lowArr.push(quote.low);
			});

			//get highest High
			highestHigh = getHigh(highArr);
			// get lowest Low
			lowestLow = getLow(lowArr);

			return {
				highestHigh: highestHigh,
				lowestLow: lowestLow
			};
			
		}
		// else, get only the last day HLOC
		else if (periodArr.length === 1) {
			
			high = periodArr[0].high;
			low = periodArr[0].low;
			open = periodArr[0].open;
			close = periodArr[0].close;
			
			return {
				high: high,
				low: low,
				open: open,
				close: close
			};
			
		}

	}
	
	// ==========================================================================
	// PUBLIC
	// ==========================================================================
	return {
		getPeriod: getPeriod,
		getHigh: getHigh,
		getLow: getLow,
		getHLOC: getHLOC,
	};

})(); // end SCREENER API