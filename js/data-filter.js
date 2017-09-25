function dataFilter(data, stock) {
	let stockData = [];
	for (const value of data) {
	  if (value.code === stock) {
	  	stockData.push(value)
	  }
	}
	return stockData;
}