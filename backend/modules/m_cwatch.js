const fs = require('fs');
const path = require('path'); 

// CWATCH
const fromExponential = require('from-exponential');
const { createCanvas, loadImage, Image } = require('canvas')
let Chart = require('chart.js');

let _APP = null;

let _MOD = {
	// Init this module.
	module_init: function(parent){
		_APP = parent;
		
		// Add routes.
		_MOD.addRoutes(_APP.app, _APP.express);
	},

	// Adds routes for this module.
	addRoutes: function(app, express){
		//
		_APP.addToRouteList({ path: "/getCwatchCharts", method: "get", args: ['coingeckoids'], file: __filename, desc: "Returns chart images based on provided coingecko ids." });
		app.get('/getCwatchCharts'    ,express.json(), async (req, res) => {
			let coingeckoids = req.query.coingeckoids.split(",");
			let resp = await _MOD.getCwatchCharts(coingeckoids); 
			res.json(resp);
		});

		//
		_APP.addToRouteList({ path: "/getCoinList", method: "get", args: [], file: __filename, desc: "Returns the server's list of coingecko ids." });
		app.get('/getCoinList'    ,express.json(), async (req, res) => {
			let resp = await _MOD.getCoinList(); 
			res.json(resp);
		});
	},

	// ROUTED: Returns the list of coins.
	getCoinList : function(){
		return _APP.m_config.getCoinData_ram().keys;
	},
	
	// ROUTED:
	getCwatchCharts : async function(coingeckoids){
		return new Promise(async function(resolve,reject){
			// Creates the chart config.
			let getChartConfigs = function(obj){
				// Break out the values. 
				let dataValues    = obj.dataValues;
				let dateValues    = obj.dateValues;
				let coingeckoid   = obj.coingeckoid;
				let changePercent = obj.changePercent;
				let coinLastPrice = obj.coinLastPrice;
	
				// Get the smallest and the largest price in the dataValues. 
				let min = Math.min(...arrs);
				let max = Math.max(...arrs);
	
				// Get the first price and the last price in the dataValues. 
				let startPrice = dataValues[0];
				// let lastPrice = dataValues[dataValues.length-1];
				let lastPrice = coinLastPrice;
				let isUpInPrice = startPrice <= lastPrice ? true : false;
				changePercent = (isUpInPrice ? "" : "") + ((changePercent)) + "%";
	
				// Determine the line color and the fill color. 
				let backgroundColor = isUpInPrice ? "rgba(0, 128, 0, 0.25)" : "rgba(255, 0, 0, 0.25)";
				let borderColor     = isUpInPrice ? "rgba(0, 128, 0, 1.0)"  : "rgba(255, 0, 0, 1.0)";
	
				// Generate the chart title. 
				let titleText = [
					`${coingeckoid.toUpperCase()}`, 
					`$${lastPrice} (${changePercent})`,
				];
	
				// We don't want x labels but something needs to be there. 
				// const labels = dateValues.map(function(d){return null; });
				const labels = dateValues.map(function(d){return ""; });
				// const labels = dateValues.map(function(d){return "*"; });
				// const labels = dateValues.map(function(d){d; });
	
				const data = {
					labels: labels,
					datasets: [
						{
							label: "Prices",
							data: dataValues,
							// fill: false,
							fill: true,
							backgroundColor: backgroundColor,
							borderColor    : borderColor,
							spanGaps: true,
							// tension: 0.5,
							stepped: true,
							borderWidth:1,
						},
					]
				};
				
				let showLine = function(context){
					// return context.tick.value %24 == 0 && context.tick.value != 0;
					return context.tick.value %24 == 0 ;
				};
	
				const config = {
					type: 'line',
					data: data,
					options: {
						responsive: false,
						maintainAspectRatio : false,
						scales: {
							x: {
								grid: {
									display  : true,
									color    : (showLine ? Chart.defaults.backgroundColor : "rgba(0, 0, 0, 0)"),
									// lineWidth: (showLine ? 1 : 0),
									lineWidth: function(context) { return showLine(context) ? 1 : 0; },
								},
								ticks: {
									// display: true,
									display: false, // This will remove only the label text.
								}
							},
							y: {
								beginAtZero:false,
								min: min, 
								max: max, 
								grid: {
									display: true
								},
								ticks: {
									font: {
										size: 8,
									},
									callback: (val) => { 
										return Number(val.toString()).toFixed(8); 
									}
								}
							}
						},
						elements: {
							point:{
								radius: 0,
								borderWidth: 0,
								
								// 'circle', 'cross', 'crossRot', 'dash', 'line', 'rect', 'rectRounded', 'rectRot', 'star', 'triangle'
								// pointStyle : "rect",
								// pointStyle : randomPointStyle,
								// radius: customRadius,
								// backgroundColor: "rgba(0, 0, 0, 1)",
							}
						},
						plugins: {
							legend: {
								position: 'top',
								display: false,
							},
							title: {
								display: true,
								text: titleText,
								font: {
									size: 11
								}
							}
						}
					},
				};
	
				// Return the data.
				return {
					// Chart config.
					config    : config,
	
					// Get the start date and the end date from the dateValues.
					startDate : dateValues[0],
					endDate   : dateValues[dateValues.length-1],
				}
			};
	
			// Get the market data for each coin.
			let arrs = [];
			let dataProms = [];
			let coinsData;
			let updateCoinsData = false;
			try{ coinsData = await _MOD.getCoinMarketData(coingeckoids); }
			catch(e){
				resolve(
					{
						"png"        : null,
						"url"        : null,
						"coingeckoid": null,
						"startDate"  : null,
						"endDate"    : null,
						"error"      : e,
					}
				);
				return; 
			}
	
			// Get the existing coins. 
			let coinList = _APP.m_config.getCoinData_ram();
	
			// Create the "arr" records.
			for(let i=0; i<coingeckoids.length; i+=1){
				let coingeckoid = coingeckoids[i];
				dataProms.push(
					new Promise(async function(res_i, rej_i){
						// Try to find a matching coin from the local coins list. 
						let coinImg = coinList.data.find(function(d){ 
							return d.id == coingeckoid; 
						});
	
						// Use the local coins list image if it exists.
						if(coinImg){ 
							// console.log("image found:", coingeckoid, coinImg, process.cwd()); 
							coinImg = coinImg.image; 
						}
						
						// Otherwise, use the default _NOIMAGE.png.
						else{ 
							// console.log("image NOT found", coingeckoid);
							let newData = await _MOD.getCoinData(coingeckoid);
							if( newData.image.thumb ){
								// Request the data from coingecko.
								let resp1;
								try{ 
									let ext = newData.image.thumb.split("?")[0].split(".").pop();
	
									resp1 = await _APP.m_fetch.fetch( newData.image.thumb );
									resp1 = await resp1.buffer();
	
									// console.log("writing new file for:", coingeckoid);
									fs.writeFileSync(`./public/coinImgs/${newData.symbol}.${ext}`, resp1);
									coinImg = `public/coinImgs/${newData.symbol}.${ext}`; 
								} 
								catch(e){ 
									coinImg = "public/coinImgs/_NOIMAGE.png"; 
									// console.log(e); reject(e); 
									// return; 
								}
								if(coinList.keys.indexOf(coingeckoid) == -1){
									coinList.keys.push(coingeckoid);
								}
								coinList.data.push({"id":coingeckoid, "image":coinImg});
								updateCoinsData = true;
							}
						}
						
						// Generate the full coingecko chart url. 
						let url = `https://www.coingecko.com/en/coins/${coingeckoid}/usd`;
						
						// Add the data.
						arrs[i] = {
							coingeckoid: coingeckoid, 
							data       : coinsData.find(function(f){ return coingeckoid == f.id; }), 
							coinImg    : coinImg,
							url        : url, 
						};
	
						// Resolve.
						res_i();
					})
				);
			}
			await Promise.all(dataProms);
			if(updateCoinsData){
				_APP.m_config.updateCoinDataFile(coinList);
			}
	
			// Create a chart for each coin.
			let chartProms = [];
			for(let i=0; i<coingeckoids.length; i+=1){
				chartProms.push(
					new Promise(async function(res_i, rej_i){
						// Generate the data.
						let rec = arrs[i];
						
						// Fail right away if the data key isn't populated.
						if(!rec.data){ console.log("data key not populated:", arrs[i], i); res_i(); return; }
	
						// Break out the values.
						let dataValues = rec.data.prices.map(function(d, i2){ 
							return (Number(d[1]).toFixed(8)); 
							// return fromExponential(parseFloat(d[1].toFixed(10)));
						});
						let dateValues = rec.data.prices.map(function(d, i2){ return d[0]; });
	
						// Change rec.data.coinLastPrice to a string having at max 10 decimal places, strip trailing 0's. 
						if(typeof rec.data.coinLastPrice == "number"){
							rec.data.coinLastPrice = fromExponential(parseFloat(rec.data.coinLastPrice.toFixed(10)));
						}
						// Limit dataValues and dateValues to x days (instead of 7.)
						let removeLeadingDays = 0;
						// let removeLeadingDays = 2;
						if(removeLeadingDays ){
							dataValues = dataValues.filter(function(v, vi){ return vi > (24 * removeLeadingDays); });
							dateValues = dateValues.filter(function(v, vi){ return vi > (24 * removeLeadingDays); });
						}
	
						// Get the chart configs. 
						let chartData = getChartConfigs({
							dataValues   : dataValues,
							dateValues   : dateValues,
							coingeckoid  : rec.coingeckoid,
							changePercent: Number(fromExponential(rec.data.price_change_percentage_7d_in_currency)).toFixed(2),
							coinLastPrice: rec.data.coinLastPrice,
						});
	
						// Save some data to the rec.
						rec.startDate = chartData.startDate;
						rec.endDate   = chartData.endDate;
	
						// Create the chart.
						const canvas  = createCanvas(205, 160);
						const ctx     = canvas.getContext('2d');
						const myChart = new Chart(ctx, chartData.config);
						ctx.imageSmoothingEnabled       = false;
						ctx.webkitImageSmoothingEnabled = false;
						ctx.mozImageSmoothingEnabled    = false;
						ctx.msImageSmoothingEnabled     = false;
						ctx.oImageSmoothingEnabled      = false;
	
						// Save some extra data to the record.
						rec.priceChangesPercent = {
							"p_1h"   : rec.data.price_change_percentage_1h_in_currency,
							"p_24h"  : rec.data.price_change_percentage_24h_in_currency,
							"p_7d"   : rec.data.price_change_percentage_7d_in_currency,
							"p_14d"  : rec.data.price_change_percentage_14d_in_currency,
							"p_30d"  : rec.data.price_change_percentage_30d_in_currency,
							"p_200d" : rec.data.price_change_percentage_200d_in_currency,
							"p_1y"   : rec.data.price_change_percentage_1y_in_currency,
						};
						rec.last_updated = rec.data.last_updated ;
						rec["debug"] = {
							"dataPointCount"    : dataValues.length      ,
							"removeLeadingDays" : removeLeadingDays      ,
							// "last_updated"      : rec.data.last_updated  ,
							// "id"                : rec.data.id            ,
							// "test"              : rec.data               ,
							// "coin"              : rec.data.coin          ,
							// "coinLastPrice"     : rec.data.coinLastPrice ,
						};
	
						// Add a background graphic.
						const img = new Image()
						img.onload = () => {
							ctx.drawImage(img, 0, 0, 25, 25);
							canvas.toDataURL('image/png', (err, png) => { 
								// Save the png data to the record.
								rec.png = png;
								res_i();
							});
						}
						img.onerror = err => { rej_i(err); throw err }
						img.src = rec.coinImg;
					})
				);
			}
			await Promise.all(chartProms);
	
			// Return only the required data.
			resolve( arrs.map(function(d){ 
				return {
					"png"                 : d.png,
					"url"                 : d.url,
					"priceChangesPercent" : d.priceChangesPercent,
					"coingeckoid"         : d.coingeckoid,
					"startDate"           : d.startDate,
					"endDate"             : d.endDate,
					"error"               : "",
					"last_updated"        : d.last_updated,
					"id"                  : d.id,
	
					"debug": d.debug,
				}
			} ) );
		});
	},
	
	// Make the request for the latest prices.
	getUpdatedPrices : async function(){
		let coingeckoIds = _APP.m_config.getConfig_ram().coingeckoIds;
	
		let obj = {
			url: `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoIds.join(',')}&vs_currencies=usd`,
			options: {
				"async": false,
				"crossDomain": true,
				"method": "GET",
				"muteHttpExceptions": true,
				"headers": {
					'Content-Type': 'application/json',
				}
			}
		};
		let newPrices = await _APP.m_fetch.send(obj.url, obj.options);
		return newPrices;
	},
	
	// (current_price), (7d, 7hr points), (1h,24h,7d,14d,30d,200d,1y change%)
	getCoinMarketData : function(coingeckoids){
		return new Promise(async function(resolve,reject){
			// Request the data from coingecko.
			let obj = {
				url: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coingeckoids.join(',')}&per_page=1&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d%2C14d%2C30d%2C200d%2C1y`,
				options: {
					"async": false,
					"crossDomain": true,
					"method": "GET",
					"muteHttpExceptions": true,
					"headers": {
						'Content-Type': 'application/json',
					}
				}
			};
			let resp1;
			try{ resp1 = await _APP.m_fetch.send(obj.url, obj.options); } 
			catch(e){ console.log(e); reject(e); return; }
	
			let retData = [];
	
			// Now, add to the data.
			if(resp1){
				resp1.forEach(async function(coin){
					let obj = {
						prices: [],
	
						price_change_percentage_1h_in_currency   : coin.price_change_percentage_1h_in_currency,
						price_change_percentage_24h_in_currency  : coin.price_change_percentage_24h_in_currency,
						price_change_percentage_7d_in_currency   : coin.price_change_percentage_7d_in_currency,
						price_change_percentage_14d_in_currency  : coin.price_change_percentage_14d_in_currency,
						price_change_percentage_30d_in_currency  : coin.price_change_percentage_30d_in_currency,
						price_change_percentage_200d_in_currency : coin.price_change_percentage_200d_in_currency,
						price_change_percentage_1y_in_currency   : coin.price_change_percentage_1y_in_currency,
	
						id            : coin.id,
						coinLastPrice : Number(fromExponential(coin.current_price)),
						last_updated  : Number(fromExponential(coin.last_updated)),
					};
	
					coin.sparkline_in_7d.price.forEach(function(d,i){
						obj.prices.push( ["", d] );
					});
	
					retData.push(obj);
				});
			}
	
			resolve(retData);
		});
	},

	// Provide coingeckoid, get coin data back. 
	getCoinData : function(coingeckoid){
		return new Promise(async function(resolve,reject){
			// Generate the url.
			let url = `https://api.coingecko.com/api/v3/coins/${coingeckoid}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
	
			let obj = {
				url: url,
				options: {
					"async": false,
					"crossDomain": true,
					"method": "GET",
					"muteHttpExceptions": true,
					"headers": {
						'Content-Type': 'application/json',
					}
				}
			};
	
			// Request the data from coingecko.
			let resp1;
			try{ resp1 = await _APP.m_fetch.send(obj.url, obj.options); } 
			catch(e){ console.log(e); reject(e); return; }
	
			// Change the data to fit. 
			let data = {
				"id"                : resp1.id                ,
				"symbol"            : resp1.symbol            ,
				"name"              : resp1.name              ,
				"links"             : resp1.links             ,
				"image"             : resp1.image             ,
				"genesis_date"      : resp1.genesis_date      ,      
				"asset_platform_id" : resp1.asset_platform_id ,
				"contract_address"  : resp1.contract_address  ,  
				"last_updated"      : resp1.last_updated      ,      
			};
	
			// Filter out some of the unwanted data from links (anything blank or otherwise false.)
			for(let key1 in data.links){
				
				// If this is an array filter out all the blank entries.
				if(Array.isArray(data.links[key1])){
				
					// A blank string is considered false;
					data.links[key1] = data.links[key1].filter(function(l){ return l; });
				}
			};
	
			resolve(data);
		});
	},
};

module.exports = _MOD;
