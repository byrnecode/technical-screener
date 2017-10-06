var ATR = (function (S) {

	// ==========================================================================
	// PRIVATE
	// ==========================================================================
	
	// periods/days that is included in the formula
	// negative value means going back on past N days
	const PERIOD_SETTING = 20, // required minimum period of data
				LAST_DAY = -1, // past 1 day
				PREV_DAY = -2; // past 2 day

	// Method 1: The Current Period High minus (-) Current Period Low
	function getTrueRangeA (currentHigh, currentLow) {
		var tr = currentHigh - currentLow;
		// round-off to 4 decimal places, and remove trailing zeros
		tr = +tr.toFixed(4);
		return tr;
	}

	// Method 2: The Absolute Value (abs) of the Current Period High minus (-) The Previous Period Close
	function getTrueRangeB (currentHigh, previousClose) {
		var tr = currentHigh - previousClose;
		// round-off to 4 decimal places, and remove trailing zeros
		tr = +tr.toFixed(4);
		return Math.abs(tr);
	}

	// Method 3: The Absolute Value (abs) of the Current Period Low minus (-) The Previous Period Close
	function getTrueRangeC (currentLow, previousClose) {
		var tr = currentLow - previousClose;
		// round-off to 4 decimal places, and remove trailing zeros
		tr = +tr.toFixed(4);
		return Math.abs(tr);
	}

	// The True Range is the largest of the 3 methods
	function getTrueRange (trueRangeArr) {
		var tr = S.getHigh(trueRangeArr);
		// round-off to 4 decimal places, and remove trailing zeros
		tr = +tr.toFixed(4);
		return tr;
	}

	function getATR (data, periodSetting) {

		if (data.length >= periodSetting) {
			var atrBacktrack  = periodSetting * -2; // periodSetting * 2 = past periods for average smoothing
			var period = S.getPeriod(data, atrBacktrack);
			var trueRangeArr = [],
					trueRange;

			// calculate individual true range of a given set of period
			// then store them in an array
			period.forEach(function (quote, index, array) {
				if (index === 0) {
					trueRange = getTrueRangeA(quote.high, quote.low);
					trueRangeArr.push(trueRange);
					return;
				}
				else {
					var previousDay = index - 1;
					var currentQuote = quote,
							previousQuote = array[previousDay];

					var trueRangeA = getTrueRangeA(currentQuote.high, currentQuote.low);
					var trueRangeB = getTrueRangeB(currentQuote.high, previousQuote.close);
					var trueRangeC = getTrueRangeC(currentQuote.low, previousQuote.close);
					var arr = [trueRangeA, trueRangeB, trueRangeC];
					// get the largest value from the 3 true range
					trueRange = getTrueRange(arr);
					trueRangeArr.push(trueRange);
				}
			});
			
			// must start with a 20-day simple average of the True Range for the initial calculation
			// get the average of the first 20 True Range values
			var total = 0;
			for (var x = 0; x < periodSetting; x++) {
				total += trueRangeArr[x];
			}
			var initialATR = total / periodSetting;

			// slice the trueRangeArr since we already got the average of the first 20
			var trueRangeArrFinal = trueRangeArr.slice(periodSetting);

			// subsequent ATR values are smoothed
			// Current ATR = [(Prior ATR x 19) + Current TR] / 20
			// - Multiply the previous 14-day ATR by periodSetting - 1.
			// - Add the most recent day's TR value.
			// - Divide the total by periodSetting
			var currentATR = trueRangeArrFinal.reduce(function (previousATR, currentTR, index) {
				return ((previousATR * (periodSetting - 1)) + currentTR) / periodSetting;
			}, initialATR);

			// round-off to 4 decimal places, and remove trailing zeros
			currentATR = +currentATR.toFixed(4);
		} 
		else {
			// console.log(`Can't calculate ATR data of ${data[0].code}, only ${data.length} periods.`);
			var currentATR = 'failed..';
		}

		return currentATR;
		
	}

	// ==========================================================================
	// PUBLIC
	// ==========================================================================
	return {
		periodSetting: PERIOD_SETTING,
		getATR: getATR
	};

})(SCREENER); // end ATR API