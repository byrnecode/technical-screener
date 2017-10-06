var ATR = (function () {

	// PRIVATE METHODS and PROPERTIES
	
	// periods/days that is included in the formula
	// negative value means going back on past N days
	const PERIOD_SETTING = 20, // required minimum period of data
				LAST_DAY = -1, // past 1 day
				PREV_DAY = -2, // past 2 day
				ATR_BACKTRACK = PERIOD_SETTING * -2; // PERIOD_SETTING * 2 = past periods for average smoothing

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

		// Method 1: The Current Period High minus (-) Current Period Low
		getTrueRangeA: function (currentHigh, currentLow) {
			var tr = currentHigh - currentLow;
			// round-off to 4 decimal places, and remove trailing zeros
			tr = +tr.toFixed(4);
			return tr;
		},

		// Method 2: The Absolute Value (abs) of the Current Period High minus (-) The Previous Period Close
		getTrueRangeB: function (currentHigh, previousClose) {
			var tr = currentHigh - previousClose;
			// round-off to 4 decimal places, and remove trailing zeros
			tr = +tr.toFixed(4);
			return Math.abs(tr);
		},

		// Method 3: The Absolute Value (abs) of the Current Period Low minus (-) The Previous Period Close
		getTrueRangeC: function (currentLow, previousClose) {
			var tr = currentLow - previousClose;
			// round-off to 4 decimal places, and remove trailing zeros
			tr = +tr.toFixed(4);
			return Math.abs(tr);
		},

		// The True Range is the largest of the 3 methods
		getTrueRange: function (trueRangeArr) {
			var tr = ATR.getHigh(trueRangeArr);
			// round-off to 4 decimal places, and remove trailing zeros
			tr = +tr.toFixed(4);
			return tr;
		},

		getATR: function (data, periodSetting) {
			var period = ATR.getPeriod(data, ATR_BACKTRACK);
			var trueRangeArr = [],
					trueRange;
			period.forEach(function (quote, index, array) {
				if (index === 0) {
					trueRange = ATR.getTrueRangeA(quote.high, quote.low);
					trueRangeArr.push(trueRange);
					return;
				}
				else {
					var previousDay = index - 1;
					var currentQuote = quote,
							previousQuote = array[previousDay];

					var trueRangeA = ATR.getTrueRangeA(currentQuote.high, currentQuote.low);
					var trueRangeB = ATR.getTrueRangeB(currentQuote.high, previousQuote.close);
					var trueRangeC = ATR.getTrueRangeC(currentQuote.low, previousQuote.close);
					var arr = [trueRangeA, trueRangeB, trueRangeC];
					// get the largest value from the 3 true range
					trueRange = ATR.getTrueRange(arr);
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
			return currentATR;
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
				var atr = ATR.getATR(data, PERIOD_SETTING);

				// display caculated values
				$atrValueContainer.html(atr);
				
			}

			function failDataFilter() {

				var failedStatus = 'failed..';
				
				// display failed status
				$atrValueContainer.html(failedStatus);

			}

			if (data.length >= PERIOD_SETTING) {
				doneDataFilter(data);
			} 
			else {
				console.log(`Can't calculate ${stock}, only ${data.length} periods.`);
				failDataFilter();
			}

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