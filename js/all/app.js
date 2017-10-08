// APP Module
var APP = (function ($, ICHIMOKU, DONCHIAN, ATR) {

	// ==========================================================================
	// PRIVATE
	// ==========================================================================
	
	// ==========================================================================
	// Method to initialize table data
	// ==========================================================================
	function initData () {
		
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
			populateStockList(stocksList);
			
			// set Screener data
			setScreenerData();

		})
		.fail(function () {
			
			// set quote status
			$('.quote-status').html('Failed to acquire the latest data, try refreshing the browser.');
			
		});
	}

	// ==========================================================================
	// Method to populate the table with stock list
	// Params: (Object) Stock list with data
	// ==========================================================================
	function populateStockList (stocksList) {
		
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
					'<td class="donchian-upper"></td>' +
					'<td class="donchian-lower"></td>' +
					'<td class="atr-value"></td>' +
				'</tr>'
			);
			
		});

	}

	// ==========================================================================
	// Method to set Screener values
	// ==========================================================================
	function setScreenerData () {
		// display loading status
		$('#main-table > tbody > tr > td').not('.stock, .last-price, .volume, .chikou-span').html('loading..');
		
		$('#main-table > tbody > tr').each( function () {
			getScreenedData($(this));
		});
	}

	// ==========================================================================
	// Method to get Screened data and display the calculated values
	// Params: (Object) context/container of html values
	// ==========================================================================
	function getScreenedData (context) {
	
		var stock = context.find('.stock').html(),
				lastPrice = context.find('.last-price').html(),
				$tenkanContainer = context.find('.tenkan-sen'),
				$kijunContainer = context.find('.kijun-sen'),
				$ssaContainer = context.find('.senkou-span-a'),
				$ssbContainer = context.find('.senkou-span-b'),
				$tkCrossContainer = context.find('.tk-cross'),
				$pkCrossContainer = context.find('.pk-cross'),
				$priceCloudContainer = context.find('.price-to-cloud'),
				$chikouCloudContainer = context.find('.chikou-to-cloud'),
				$cloudFutureContainer = context.find('.cloud-future'),
				$donchianUpperContainer = context.find('.donchian-upper'),
				$donchianLowerContainer = context.find('.donchian-lower'),
				$atrValueContainer = context.find('.atr-value');

		var data = dataFilter(historicalData, stock);

		(function doneDataFilter(data) {

			// ICHIMOKU computations
			// ======================================================================
			// get Ichimoku results
			var ichiResults = ICHIMOKU.getResults(data, lastPrice);

			// display caculated values
			$tenkanContainer.html(ichiResults.tenkanSen);
			$kijunContainer.html(ichiResults.kijunSen);
			$ssaContainer.html(ichiResults.senkouSpanA);
			$ssbContainer.html(ichiResults.senkouSpanB);
			$tkCrossContainer.html(ichiResults.tkCross);
			$pkCrossContainer.html(ichiResults.pkCross);
			$priceCloudContainer.html(ichiResults.priceToCloud);
			$chikouCloudContainer.html(ichiResults.chikouToCloud);
			$cloudFutureContainer.html(ichiResults.cloudFuture);

			// DONCHIAN computations
			// ======================================================================
			// get Donchian
			var hl = DONCHIAN.getDonchian(data, DONCHIAN.periodSetting);

			// display caculated values
			$donchianUpperContainer.html(hl.highestHigh);
			$donchianLowerContainer.html(hl.lowestLow);

			// ATR computations
			// ======================================================================
			// get ATR
			var atr = ATR.getATR(data, ATR.periodSetting);

			// display caculated values
			$atrValueContainer.html(atr);
			
		})(data)

	}

	// ==========================================================================
	// Method to filter data with only the specific Stock code
	// Params: (Object) Historical Stock Data,
	//				(String) stock code
	// ==========================================================================
	function dataFilter(data, stock) {
		let stockData = [];
		for (const value of data) {
		  if (value.code === stock) {
		  	stockData.push(value)
		  }
		}
		return stockData;
	}

	// ==========================================================================
	// PUBLIC
	// ==========================================================================
	return {
		initData: initData
	};

})(jQuery, ICHIMOKU, DONCHIAN, ATR); // end APP Module

$(document).ready( function () {
	
	$('#all-screener').click( function () {
		APP.initData();
	});
	
});