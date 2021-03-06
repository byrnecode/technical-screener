var ICHIMOKU = (function () {

	// PRIVATE METHODS and PROPERTIES
	
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
	
	
	// PUBLIC METHODS and PROPERTIES
	return {

		// ========================================================================
		// Method to get certain period of days
		// Params: (Array/Object) data from API,
		// 				 (Int) past number of days,
		// 				 (Int) offset number of days to start from counting (optional)
		// Return: (Array/Object) trimed period of days from API data
		// ========================================================================
		getPeriod: function (data, backtrack, offset) {
			var periods = data.slice(backtrack, offset);
			return periods;
		},

		// ========================================================================
		// Method to get highest High of data
		// Params: (Array) array of High values from API data
		// Return: (Int/Float) highest High value
		// ========================================================================
		getHigh: function (arr) {
			var high = Math.max(...arr);
			return high;
		},
		
		// ========================================================================
		// Method to get lowest Low of data
		// Params: (Array) array of Low values from API data
		// Return: (Int/Float) lowest Low value
		// ========================================================================
		getLow: function (arr) {
			var low = Math.min(...arr);
			return low;
		},
		
		// ========================================================================
		// Method to check Subject relative to Kijun-Sen
		// the 'Subject' can be the 'Tenkan-Sen' or the 'Last Price'
		// Params: (Int/Float) Subject, Kijun-Sen
		// Return: (String) 'above' if Subject is higher than Kijun-Sen,
		// 				 'below' if Subject is lower than Kijun-Sen,
		// 				 'cross' if Subject is equal to Kijun-Sen
		// ========================================================================
		relativeToKijun: function (subject, kijunSen) {
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
		},
		
		// ========================================================================
		// Method to check Subject relative to Cloud
		// the 'Subject' can be the 'Last Price' or the 'Chikou-Span'
		// Params: (Int/Float) Subject, Senkou-Span-A, Senkou-Span-B
		// Return: (String) 'above' if Subject is above the Cloud,
		// 				 'top-edge' if Subject is on top edge of Cloud,
		// 				 'inside' if Subject is inside the Cloud,
		// 				 'bottom-edge' if Subject is on bottom edge of Cloud,
		// 				 'below' if Subject is below the Cloud
		// ========================================================================
		relativeToCloud: function (subject, senkouSpanA, senkouSpanB) {
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
		},
		
		// ========================================================================
		// Method to check future Cloud values
		// Params: (Int/Float) Future Senkou-Span-A, Future Senkou-Span-B
		// Return: (String) 'bullish' if Senkou-Span-A is above Senkou-Span-B,
		// 				 'twist' if Senkou-Span-A is equal Senkou-Span-B,
		// 				 'bearish' if Senkou-Span-A is below Senkou-Span-B
		// ========================================================================
		cloudFuture: function (futureSenkouSpanA, futureSenkouSpanB) {
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
		},
		
		// ========================================================================
		// Method to get Historical data and display the calculated values
		// Params: (Object) context/container of html values
		// ========================================================================
		getHistoricalData: function (context) {
		
			var stock = context.find('.stock').html(),
					lastPrice = context.find('.last-price').html(),
					chikouSpan = context.find('.chikou-span').html(),
					$tenkanContainer = context.find('.tenkan-sen'),
					$kijunContainer = context.find('.kijun-sen'),
					$ssaContainer = context.find('.senkou-span-a'),
					$ssbContainer = context.find('.senkou-span-b'),
					$tkCrossContainer = context.find('.tk-cross'),
					$pkCrossContainer = context.find('.pk-cross'),
					$priceCloudContainer = context.find('.price-to-cloud'),
					$chikouCloudContainer = context.find('.chikou-to-cloud'),
					$cloudFutureContainer = context.find('.cloud-future');

			function dataFilter(data, stock) {
				let stockData = [];
				for (const value of data) {
				  if (value.code === stock) {
				  	stockData.push(value)
				  }
				}
				return stockData;
			}

			var data = dataFilter(historicalData, stock);

			function doneDataFilter(data) {

				// set Tenkan-Sen, Kijun-Sen, Senkou-Span-B
				var tenkanSen = ICHIMOKU.getIndicator(data, TENKAN_BACKTRACK),
						kijunSen = ICHIMOKU.getIndicator(data, KIJUN_BACKTRACK),
						senkouSpanB = ICHIMOKU.getIndicator(data, SSB_BACKTRACK, SSB_OFFSET);
				
				// computation for Senkou-Span-A
				var ts = ICHIMOKU.getIndicator(data, SSA_TS_BACKTRACK, SSA_OFFSET),
						ks = ICHIMOKU.getIndicator(data, SSA_KS_BACKTRACK, SSA_OFFSET),
						senkouSpanA = (ts + ks) / 2;
				
				// get the 'future' cloud values
				var futureSenkouSpanB = ICHIMOKU.getIndicator(data, FUTURE_SSB_BACKTRACK),
						futureSenkouSpanA = (tenkanSen + kijunSen) / 2;
				
				// get the cloud values relative to Chikou-Span
				var chikouSenkouSpanB = ICHIMOKU.getIndicator(data, CHIKOU_SSB_BACKTRACK, CHIKOU_SSB_OFFSET),
						cts = ICHIMOKU.getIndicator(data, CHIKOU_SSA_TS_BACKTRACK, CHIKOU_SSA_OFFSET),
						cks = ICHIMOKU.getIndicator(data, CHIKOU_SSA_KS_BACKTRACK, CHIKOU_SSA_OFFSET), 
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
				
				// debugging
				// console.log(stock + ' - chikou ssa: ' + chikouSenkouSpanA + ', chikou ssb: ' + chikouSenkouSpanB + ' - futureCloud ssa: ' + futureSenkouSpanA + ', futureCloud ssb: ' + futureSenkouSpanB);
				
				// ichimoku screener
				lastPrice = parseFloat(lastPrice);
				var tkCross = ICHIMOKU.relativeToKijun(tenkanSen, kijunSen),
						pkCross = ICHIMOKU.relativeToKijun(lastPrice, kijunSen),
						priceToCloud = ICHIMOKU.relativeToCloud(lastPrice, senkouSpanA, senkouSpanB),
						chikouToCloud = ICHIMOKU.relativeToCloud(chikouSpan, chikouSenkouSpanA, chikouSenkouSpanB),
						cloudFuture = ICHIMOKU.cloudFuture(futureSenkouSpanA, futureSenkouSpanB);
				
				// display caculated values
				$tenkanContainer.html(tenkanSen);
				$kijunContainer.html(kijunSen);
				$ssaContainer.html(senkouSpanA);
				$ssbContainer.html(senkouSpanB);
				$tkCrossContainer.html(tkCross);
				$pkCrossContainer.html(pkCross);
				$priceCloudContainer.html(priceToCloud);
				$chikouCloudContainer.html(chikouToCloud);
				$cloudFutureContainer.html(cloudFuture);
				
			}

			function failDataFilter() {

				var failedStatus = 'failed..';
				
				// display failed status
				$tenkanContainer.html(failedStatus);
				$kijunContainer.html(failedStatus);
				$ssaContainer.html(failedStatus),
				$ssbContainer.html(failedStatus);
				$tkCrossContainer.html(failedStatus);
				$pkCrossContainer.html(failedStatus);
				$priceCloudContainer.html(failedStatus);
				$chikouCloudContainer.html(failedStatus);
				$cloudFutureContainer.html(failedStatus);

			}

			if (data.length >= 104) {
				doneDataFilter(data);
			} 
			else {
				console.log(`Can't calculate ${stock}, only ${data.length} periods.`);
				failDataFilter();
			}

			// get data from API
			// $.ajax({
			// 	url: 'https://cors-anywhere.herokuapp.com/http://api.manilainvestor.com/v1/stocks/hdata/' + stock,
			// 	dataType: "json"
			// })
			// .done(function (data) {
				
				
				
			// })
			// .fail(function () {
				
				
				
			// });

		},
		
		// ========================================================================
		// Method to compute for Tenkan-Sen, Kijun-Sen, and Senkou-Span-B
		// because they share the same formula but with different parameters
		// Params: (Object) data, (Int) backtrack, (Int) offset (optional)
		// Return: (Int/Float) calculated value
		// ========================================================================
		getIndicator: function () {
			
			var data = arguments[0],
					backtrack = arguments[1],
					offset = arguments[2],
					hl,
					highestHigh,
					lowestLow,
					result;
			
			// get highest high and lowest low of data
			hl = ICHIMOKU.getHLOC(data, backtrack, offset);
			highestHigh = hl.highestHigh;
			lowestLow = hl.lowestLow;

			// compute Tenkan-Sen, Kijun-Sen, Senkou-Span-B
			result = (highestHigh + lowestLow) / 2;
			return result;
			
		},
		
		// ========================================================================
		// Method to get HLOC (High,Low,Open,Close) data
		// Params: (Object) data, (Int) backtrack, (Int) offset (optional)
		// Return: (Object) HLOC
		// ========================================================================
		getHLOC: function () {
			
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
			periodArr = ICHIMOKU.getPeriod(data, backtrack, offset);
			
			// if greater than one day, get highest high and lowest low
			if (periodArr.length > 1) {
				
				$.each(periodArr, function(index, quote) {
					// get only the Highs and add to array
					highArr.push(quote.high);
					// get only the Lows and add to array
					lowArr.push(quote.low);
				});

				//get highest High
				highestHigh = ICHIMOKU.getHigh(highArr);
				// get lowest Low
				lowestLow = ICHIMOKU.getLow(lowArr);

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

		},
		
		// ========================================================================
		// Method to populate the table with stock list
		// Params: (Object) Stock list with data
		// ========================================================================
		populateStockList: function (stocksList) {
			
			// loop through stocksList
			$.each(stocksList, function (index, stock) {
				
				var symbol = stock.symbol,
						lastPrice = stock.price.amount,
						volume = stock.volume;

				$('#main-table > tbody').append(
					'<tr>' +
						'<td class="stock">' + symbol + '</td>' +
						'<td class="last-price">' + lastPrice + '</td>' +
						'<td class="volume">' + volume + '</td>' +
						'<td class="tenkan-sen"></td>' +
						'<td class="kijun-sen"></td>' +
						'<td class="senkou-span-a"></td>' +
						'<td class="senkou-span-b"></td>' +
						'<td class="chikou-span">' + lastPrice + '</td>' +
						'<td class="tk-cross"></td>' +
						'<td class="pk-cross"></td>' +
						'<td class="price-to-cloud"></td>' +
						'<td class="chikou-to-cloud"></td>' +
						'<td class="cloud-future"></td>' +
					'</tr>'
				);
				
			});

		},
		
		// ========================================================================
		// Method to set Ichimoku values
		// ========================================================================
		setIchimokuData: function () {
			// display loading status
			$('.tenkan-sen, .kijun-sen, .senkou-span-a, .senkou-span-b, .tk-cross, .pk-cross, .price-to-cloud, .chikou-to-cloud, .cloud-future').html('loading..');
			
			$('#main-table > tbody > tr').each( function () {
				ICHIMOKU.getHistoricalData($(this));
			});
		},
		
		// ========================================================================
		// Method to initialize table data
		// ========================================================================
		initData: function () {
			
			// set quote status
			$('.quote-status').html('Fetching data...');
			
			// setup ajax to actually call the API
			$.ajax({
				url: 'https://cors-anywhere.herokuapp.com/http://phisix-api2.appspot.com/stocks.json',
				dataType: "json"
			})
			.done(function (data) {
				
				var stocksList = data.stock,
						quoteStatus = data.as_of,
						quoteStatus = new Date(quoteStatus).toLocaleString();

				// set quote status
				$('.quote-status').html('Last Updated: ' + quoteStatus);

				// call function that populates stock-list
				ICHIMOKU.populateStockList(stocksList);
				
				// set Ichimoku data
				ICHIMOKU.setIchimokuData();

			})
			.fail(function () {
				
				// set quote status
				$('.quote-status').html('Failed to acquire the latest data, try refreshing the browser.');
				
			});
		}

	};

})(); // end ICHIMOKU API

$(document).ready( function () {
	
	$('#ichimoku-screener').click( function () {
		ICHIMOKU.initData();
	});
	
});