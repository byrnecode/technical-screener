var ATR = (function () {

	// PRIVATE METHODS and PROPERTIES
	
	// the last number of periods/days that is included in the formula
	// negative value means going back on past N days
	const LAST_DAY = -1, // past 1 day
				PREV_DAY = -2, // past 2 day
				ATR_BACKTRACK = -20; // past 20 periods

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

		getTrueRangeA: function (data) {
			var currentHLOC = ATR.getHLOC(data),
					currentHigh = currentHLOC.high,
					currentLow = currentHLOC.low;

			return currentHigh - currentLow;
		},

		getTrueRangeB: function (data) {
			var currentHLOC = ATR.getHLOC(data),
					currentHigh = currentHLOC.high;

			var prevHLOC = ATR.getHLOC(data, PREV_DAY, LAST_DAY),
					prevClose = prevHLOC.close;

			return Math.abs(currentHigh - prevClose);
		},

		getTrueRangeC: function (data) {
			var currentHLOC = ATR.getHLOC(data),
					currentLow = currentHLOC.low;

			var prevHLOC = ATR.getHLOC(data, PREV_DAY, LAST_DAY),
					prevClose = prevHLOC.close;

			return Math.abs(currentLow - prevClose);
		},

		getTrueRange: function (trueRangeA, trueRangeB, trueRangeC) {
			var truerange = ATR.getHigh(trueRangeA, trueRangeB, trueRangeC);
			return truerange;
		},

		getATR: function (data) {
			var period = ATR.getPeriod(data, ATR_BACKTRACK);
			console.log(period);
			var trueRangeArr = [];
			period.forEach(function (quote, index, array) {
				if (index === 0) {
					var trueRangeA = ATR.getTrueRangeA(quote);
					trueRangeArr.push(trueRangeA);
				}
				else {
					var trueRangeA = ATR.getTrueRangeA(quote),
							trueRangeB = ATR.getTrueRangeB(quote),
							trueRangeC = ATR.getTrueRangeC(quote);
					var trueRange = ATR.getTrueRange(trueRangeA, trueRangeB, trueRangeC);
				}
			});
		},
		
		// ========================================================================
		// Method to get Historical data and display the calculated values
		// Params: (Object) context/container of html values
		// ========================================================================
		getHistoricalData: function (context) {
		
			var stock = context.find('.stock').html(),
					$atrValueContainer = context.find('.atr-value');

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

				// get atr
				var atr = ATR.getATR(data);

				// display caculated values
				$atrValueContainer.html(atr);
				
			}

			function failDataFilter() {

				var failedStatus = 'failed..';
				
				// display failed status
				$atrValueContainer.html(failedStatus);

			}

			if (data.length >= 20) {
				doneDataFilter(data);
			} 
			else {
				console.log(`Can't calculate ${stock}, only ${data.length} periods.`);
				failDataFilter();
			}

			// get data from API
			// $.ajax({
			// 	url: 'https://cors-anywhere.herokuapp.com/http://pseapi.com/api/Stock/' + stock,
			// 	dataType: "json"
			// })
			// .done(function (data) {

				

			// })
			// .fail(function () {
				
				
				
			// });

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
			periodArr = ATR.getPeriod(data, backtrack, offset);
			
			// if greater than one day, get highest high and lowest low
			if (periodArr.length > 1) {
				
				$.each(periodArr, function(index, quote) {
					// get only the Highs and add to array
					highArr.push(quote.high);
					// get only the Lows and add to array
					lowArr.push(quote.low);
				});

				//get highest High
				highestHigh = ATR.getHigh(highArr);
				// get lowest Low
				lowestLow = ATR.getLow(lowArr);

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
						'<td class="atr-value"></td>' +
					'</tr>'
				);
				
			});

		},
		
		// ========================================================================
		// Method to set ATR values
		// ========================================================================
		setATRData: function () {
			// display loading status
			$('.atr-value').html('loading..');
			
			$('#main-table > tbody > tr').each( function () {
				ATR.getHistoricalData($(this));
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
				ATR.populateStockList(stocksList);
				
				// set ATR data
				ATR.setATRData();

			})
			.fail(function () {
				
				// set quote status
				$('.quote-status').html('Failed to acquire the latest data, try refreshing the browser.');
				
			});
		}

	};

})(); // end ATR API

$(document).ready( function () {
	
	$('#atr-screener').click( function () {
		ATR.initData();
	});
	
});