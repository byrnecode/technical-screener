// DONCHIAN Module
var DONCHIAN = (function (S) {

	// ==========================================================================
	// PRIVATE
	// ==========================================================================
	
	// the last number of periods/days that is included in the formula
	// negative value means going back on past N days
	const PERIOD_SETTING = 20,
				LAST_DAY = -1; // past 1 day

	function getDonchian (data, periodSetting) {

		var dataLength = data.length;

		if (dataLength >= periodSetting) {
			var donchianBacktrack = -Math.abs(periodSetting); // past 20 periods
			// get highest high and lowest low of data
			var hl = S.getHLOC(data, donchianBacktrack),
					highestHigh = hl.highestHigh,
					lowestLow = hl.lowestLow;
			
			// round-off to 4 decimal places, and remove trailing zeros
			highestHigh = +highestHigh.toFixed(4);
			lowestLow = +lowestLow.toFixed(4);
		} 
		else {
			
			if (dataLength > 0) {
				console.log(`Can't calculate Donchian data of ${data[0].code}, only ${data.length} periods.`);
			}

			var failedStatus = 'failed..';

			var highestHigh = failedStatus,
					lowestLow = failedStatus;
		}
		
		return {
			highestHigh: highestHigh,
			lowestLow: lowestLow
		};
		
	}

	// ==========================================================================
	// PUBLIC
	// ==========================================================================
	return {
		periodSetting: PERIOD_SETTING,
		getDonchian: getDonchian
	};

})(SCREENER); // end DONCHIAN Module