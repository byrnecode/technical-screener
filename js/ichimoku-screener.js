var ICHIMOKU = (function () {

	// PRIVATE FUNCTIONS
	
	// the last number of periods/days that is included in the formula
	// negative value means going back on past N days
	const TENKAN_BACKTRACK = -9, // past 9 periods
				KIJUN_BACKTRACK = -26, // past 26 periods
				SSA_TS_BACKTRACK = -34, // past 9 periods and plotted 26 periods backwards
				SSA_KS_BACKTRACK = -51, // past 26 periods and plotted 26 periods backward
				SSA_OFFSET = -26, // past 26 periods
				SSB_BACKTRACK = -78, // past 52 periods and plotted 26 periods backwards
				SSB_OFFSET = -26; // past 26 periods


	// PUBLIC FUNCTIONS
	return {

		getPeriod: function (arrData, backtrack, offset) {
			var periods = arrData.slice(backtrack, offset);
			return periods;
		},

		getHigh: function (arr) {
			var high = Math.max(...arr);
			return high;
		},
		
		getLow: function (arr) {
			var low = Math.min(...arr);
			return low;
		},
		
		// =========================================================
		// Function to check for T-K Cross
		// Params: (Int/Float) Tenkan-Sen, Kijun-Sen
		// Return: (String) 'above' if Tenkan-Sen is higher than Kijun-Sen,
		// 					'below' if Tenkan-Sen is lower than Kijun-Sen,
		// 					'cross' if Tenkan-Sen is equal than Kijun-Sen
		// =========================================================
		TKCross: function (tenkanSen, kijunSen) {
			if (tenkanSen >  kijunSen) {
				return 'above';
			}
			else if (tenkanSen <  kijunSen){
				return 'below';
			}
			else {
				return 'cross';
			}
		},
		
		// =========================================================
		// Function to check for T-K Cross
		// Params: (Int/Float) Current Price, Kijun-Sen
		// Return: (String) 'above' if Current Price is higher than Kijun-Sen,
		// 					'below' if Current Price is lower than Kijun-Sen,
		// 					'cross' if Current Price is equal than Kijun-Sen
		// =========================================================
		PKCross: function (currentPrice, kijunSen) {
			if (currentPrice >  kijunSen) {
				return 'above';
			}
			else if (currentPrice <  kijunSen){
				return 'below';
			}
			else {
				return 'cross';
			}
		},
		
		// =========================================================
		// Function to get Tenkan-Sen
		// Params: (String) stock code
		// Return: (Int/Float) Tenkan-Sen value
		// =========================================================
		getHistoricalData: function (context) {
		
			var stock = context.find('.stock').html(),
					$tenkanContainer = context.find('.tenkan-sen'),
					$kijunContainer = context.find('.kijun-sen'),
					$ssaContainer = context.find('.senkou-span-a'),
					$ssbContainer = context.find('.senkou-span-b');

			// get data from API
			$.ajax({
				url: 'https://cors-anywhere.herokuapp.com/http://api.manilainvestor.com/v1/stocks/hdata/' + stock,
				dataType: "json"
			})
			.done(function (data) {
				var tenkanSen = ICHIMOKU.getIndicator(data, TENKAN_BACKTRACK),
						kijunSen = ICHIMOKU.getIndicator(data, KIJUN_BACKTRACK),
						senkouSpanB = ICHIMOKU.getIndicator(data, SSB_BACKTRACK, SSB_OFFSET);
				
				// computation for Senkou Span A
				var ts = ICHIMOKU.getIndicator(data, SSA_TS_BACKTRACK, SSA_OFFSET),
						ks = ICHIMOKU.getIndicator(data, SSA_KS_BACKTRACK, SSA_OFFSET),
						senkouSpanA = (ts + ks) / 2;
				
				tenkanSen = +tenkanSen.toFixed(4);
				kijunSen = +kijunSen.toFixed(4);
				senkouSpanA = +senkouSpanA.toFixed(4);
				senkouSpanB = +senkouSpanB.toFixed(4);
				
				$tenkanContainer.html(tenkanSen);
				$kijunContainer.html(kijunSen);
				$ssaContainer.html(senkouSpanA),
				$ssbContainer.html(senkouSpanB);
			})
			.fail(function () {
				$tenkanContainer.html('failed..');
				$kijunContainer.html('failed..');
				$ssaContainer.html('failed..'),
				$ssbContainer.html('failed..');
			});

		},
		
		getIndicator: function () {
			
			var data = arguments[0],
					backtrack = arguments[1],
					offset = arguments[2],
					periodArr,
					highArr = [],
					lowArr = [],
					highestHigh,
					lowestLow,
					result;
			
			// get only last 9 periods, add to array
			periodArr = ICHIMOKU.getPeriod(data, backtrack, offset);

			$.each(periodArr, function(index, quote){
				// get only the Highs and add to array
				highArr.push(quote.High);
				// get only the Lows and add to array
				lowArr.push(quote.Low);
			});

			//get highest High
			highestHigh = ICHIMOKU.getHigh(highArr);
			// get lowest Low
			lowestLow = ICHIMOKU.getLow(lowArr);

			// compute Tenkan-Sen, Kijun-Sen, Senkou-Span-B
			result = (highestHigh + lowestLow) / 2;
			return result;
		},
		
		//=====================================================================
		// method to populate the table with stock list
		//=====================================================================
		populateStockList: function (stock) {

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
					'<td class="above-cloud"></td>' +
					'<td class="inside-cloud"></td>' +
					'<td class="below-cloud"></td>' +
				'</tr>'
			);

		},
		
		setIchimokuData: function () {
			$('.tenkan-sen, .kijun-sen, .senkou-span-a, .senkou-span-b').html('loading..');
			
			$('#main-table > tbody > tr').each( function () {
				ICHIMOKU.getHistoricalData($(this));
			});
		},
		
		initData: (function () {
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

				// loop through the returned stocksList
				$.each(stocksList, function (index, stock) {
					// call function that populates stock-list
					ICHIMOKU.populateStockList(stock);
				});
				
				ICHIMOKU.setIchimokuData();

			})
			.fail(function () {
				// set quote status
				$('.quote-status').html('Failed to acquire the latest data, try refreshing the browser.');
			});
		})()

	};

})(); // end ICHIMOKU API