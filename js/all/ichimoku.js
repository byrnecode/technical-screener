var ICHIMOKU = (function (S) {

	// ==========================================================================
	// PRIVATE
	// ==========================================================================
	
	// the last number of periods/days that is included in the formula
	// negative value means going back on past N days
	const LAST_DAY = -1, // past 1 day
				
				TENKAN_BACKTRACK = -9, // past 9 periods
				KIJUN_BACKTRACK = -26, // past 26 periods
				
				SSA_TS_BACKTRACK = -35, // past 9 periods and plotted 26 periods backwards
				SSA_KS_BACKTRACK = -52, // past 26 periods and plotted 26 periods backward
				SSA_OFFSET = -26, // past 26 periods
				
				SSB_BACKTRACK = -78, // past 52 periods and plotted 26 periods backwards
				SSB_OFFSET = -26, // past 26 periods
				
				FUTURE_SSB_BACKTRACK = -52, // past 52 periods
				
				CHIKOU_SSA_TS_BACKTRACK = -61, // past 9 periods and plotted 52 periods backwards
				CHIKOU_SSA_KS_BACKTRACK = -78, // past 26 periods and plotted 52 periods backward
				CHIKOU_SSA_OFFSET = -52, // past 52 periods
				
				CHIKOU_SSB_BACKTRACK = -104, // past 52 periods and plotted 52 periods backwards
				CHIKOU_SSB_OFFSET = -52; // past 52 periods

	// ==========================================================================
	// Method to check Subject relative to Kijun-Sen
	// the 'Subject' can be the 'Tenkan-Sen' or the 'Last Price'
	// Params: (Int/Float) Subject, Kijun-Sen
	// Return: (String) 'above' if Subject is higher than Kijun-Sen,
	// 				 'below' if Subject is lower than Kijun-Sen,
	// 				 'cross' if Subject is equal to Kijun-Sen
	// ==========================================================================
	function relativeToKijun (subject, kijunSen) {
		if (subject > kijunSen) {
			return 'above';
		}
		else if (subject < kijunSen) {
			return 'below';
		}
		else if (subject === kijunSen) {
			return 'cross';
		}
		else {
			return 'unknown';
		}
	}

	// ==========================================================================
	// Method to check Subject relative to Cloud
	// the 'Subject' can be the 'Last Price' or the 'Chikou-Span'
	// Params: (Int/Float) Subject, Senkou-Span-A, Senkou-Span-B
	// Return: (String) 'above' if Subject is above the Cloud,
	// 				 'top-edge' if Subject is on top edge of Cloud,
	// 				 'inside' if Subject is inside the Cloud,
	// 				 'bottom-edge' if Subject is on bottom edge of Cloud,
	// 				 'below' if Subject is below the Cloud
	// ==========================================================================
	function relativeToCloud (subject, senkouSpanA, senkouSpanB) {
		if ((subject > senkouSpanA) && (subject > senkouSpanB)) {
			return 'above';
		}
		else if ( (senkouSpanA > senkouSpanB) && (subject === senkouSpanA) || (senkouSpanB > senkouSpanA) && (subject === senkouSpanB) ) {
			return 'top-edge';
		}
		else if ( ((subject < senkouSpanA) && (subject > senkouSpanB)) || ((subject > senkouSpanA) && (subject < senkouSpanB)) ) {
			return 'inside';
		}
		else if ( (senkouSpanA > senkouSpanB) && (subject === senkouSpanB) || (senkouSpanB > senkouSpanA) && (subject === senkouSpanA) ) {
			return 'bottom-edge';
		}
		else if ((subject < senkouSpanA) && (subject < senkouSpanB)) {
			return 'below';
		}
		else {
			return 'unknown';
		}
	}

	// ==========================================================================
	// Method to check future Cloud values
	// Params: (Int/Float) Future Senkou-Span-A, Future Senkou-Span-B
	// Return: (String) 'bullish' if Senkou-Span-A is above Senkou-Span-B,
	// 				 'twist' if Senkou-Span-A is equal Senkou-Span-B,
	// 				 'bearish' if Senkou-Span-A is below Senkou-Span-B
	// ==========================================================================
	function getCloudFuture (futureSenkouSpanA, futureSenkouSpanB) {
		if (futureSenkouSpanA > futureSenkouSpanB) {
			return 'bullish';
		}
		else if (futureSenkouSpanA < futureSenkouSpanB) {
			return 'bearish';
		}
		else if (futureSenkouSpanA === futureSenkouSpanB) {
			return 'twist';
		}
		else {
			return 'unknown';
		}
	}

	// ==========================================================================
	// Method to compute for Tenkan-Sen, Kijun-Sen, and Senkou-Span-B
	// because they share the same formula but with different parameters
	// Params: (Object) data, (Int) backtrack, (Int) offset (optional)
	// Return: (Int/Float) calculated value
	// ==========================================================================
	function getIchiValue () {
		
		var data = arguments[0],
				backtrack = arguments[1],
				offset = arguments[2],
				hl,
				highestHigh,
				lowestLow,
				result;
		
		// get highest high and lowest low of data
		hl = S.getHLOC(data, backtrack, offset);
		highestHigh = hl.highestHigh;
		lowestLow = hl.lowestLow;

		// compute Tenkan-Sen, Kijun-Sen, Senkou-Span-B
		result = (highestHigh + lowestLow) / 2;
		return result;
		
	}

	// ==========================================================================
	// Method to get Ichimoku Results
	// Params: (Object) context/container of html values
	//				(Int/Float) Last price of stock
	// ==========================================================================
	function getResults (data, lastPrice) {

		if (data.length >= 104) {
			// set Tenkan-Sen, Kijun-Sen, Senkou-Span-B
			var tenkanSen = getIchiValue(data, TENKAN_BACKTRACK),
					kijunSen = getIchiValue(data, KIJUN_BACKTRACK),
					senkouSpanB = getIchiValue(data, SSB_BACKTRACK, SSB_OFFSET);
			
			// computation for Senkou-Span-A
			var ts = getIchiValue(data, SSA_TS_BACKTRACK, SSA_OFFSET),
					ks = getIchiValue(data, SSA_KS_BACKTRACK, SSA_OFFSET),
					senkouSpanA = (ts + ks) / 2;
			
			// get the 'future' cloud values
			var futureSenkouSpanB = getIchiValue(data, FUTURE_SSB_BACKTRACK),
					futureSenkouSpanA = (tenkanSen + kijunSen) / 2;
			
			// get the cloud values relative to Chikou-Span
			var chikouSenkouSpanB = getIchiValue(data, CHIKOU_SSB_BACKTRACK, CHIKOU_SSB_OFFSET),
					cts = getIchiValue(data, CHIKOU_SSA_TS_BACKTRACK, CHIKOU_SSA_OFFSET),
					cks = getIchiValue(data, CHIKOU_SSA_KS_BACKTRACK, CHIKOU_SSA_OFFSET), 
					chikouSenkouSpanA = (cts + cks) / 2;
			
			// round-off to 4 decimal places, and remove trailing zeros
			tenkanSen = +tenkanSen.toFixed(4);
			kijunSen = +kijunSen.toFixed(4);
			senkouSpanA = +senkouSpanA.toFixed(4);
			senkouSpanB = +senkouSpanB.toFixed(4);
			futureSenkouSpanA = +futureSenkouSpanA.toFixed(4);
			futureSenkouSpanB = +futureSenkouSpanB.toFixed(4);
			chikouSenkouSpanA = +chikouSenkouSpanA.toFixed(4);
			chikouSenkouSpanB = +chikouSenkouSpanB.toFixed(4);

			// ichimoku screener
			lastPrice = parseFloat(lastPrice);
			var chikouSpan = lastPrice,
					tkCross = relativeToKijun(tenkanSen, kijunSen),
					pkCross = relativeToKijun(lastPrice, kijunSen),
					priceToCloud = relativeToCloud(lastPrice, senkouSpanA, senkouSpanB),
					chikouToCloud = relativeToCloud(chikouSpan, chikouSenkouSpanA, chikouSenkouSpanB),
					cloudFuture = getCloudFuture(futureSenkouSpanA, futureSenkouSpanB);
		} 
		else {
			// console.log(`Can't calculate Ichimoku data of ${data[0].code}, only ${data.length} periods.`);
			var failedStatus = 'failed..';

			var tenkanSen = failedStatus,
					kijunSen = failedStatus,
					senkouSpanA = failedStatus,
					senkouSpanB = failedStatus,
					tkCross = failedStatus,
					pkCross = failedStatus,
					priceToCloud = failedStatus,
					chikouToCloud = failedStatus,
					cloudFuture = failedStatus;
		}
		
		return {
			tenkanSen: tenkanSen,
			kijunSen: kijunSen,
			senkouSpanA: senkouSpanA,
			senkouSpanB: senkouSpanB,
			tkCross: tkCross,
			pkCross: pkCross,
			priceToCloud: priceToCloud,
			chikouToCloud: chikouToCloud,
			cloudFuture: cloudFuture
		};
		
	}

	// ==========================================================================
	// PUBLIC
	// ==========================================================================
	return {
		getResults: getResults
	};

})(SCREENER); // end ICHIMOKU API