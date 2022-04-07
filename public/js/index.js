let m_fetch = {
	// Used for GET requests expecting TEXT.
	gettext            : async function(url){
		// Backend can send anything. Interpreted as raw. 
		return fetch(url).then(response => response.text());
	},

	// Used for GET requests expecting JSON.. 
	getjson            : async function(url){
		// Backend should send JSON. 
		return fetch(url).then(response => response.json());
	},

	// Used for POST requests (configurable.)
	postjson           : async function(url, body){
		// Backend should send JSON. 
		return fetch(
			url, 
			{
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			}
		).then(response => response.json());
	},

	eventListenerSetup : function(){
	},
};

let cwatch = {
	timerId     : undefined,
	inProgress  : false,
	timerActive : false,
	defaultTime : 5 * 60, 
	remaining   : 5 * 60,
	coins: [],//["bitcoin", "crypto-com-chain"],

	toggleFullscreen : function() {
		let elem = document.documentElement;
	  
		if (!document.fullscreenElement && !document.mozFullScreenElement &&
			!document.webkitFullscreenElement && !document.msFullscreenElement) {
			if (elem.requestFullscreen) {
			elem.requestFullscreen();
			} else if (elem.msRequestFullscreen) {
			elem.msRequestFullscreen();
			} else if (elem.mozRequestFullScreen) {
			elem.mozRequestFullScreen();
			} else if (elem.webkitRequestFullscreen) {
			elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			}
		} else {
			if (document.exitFullscreen) {
			document.exitFullscreen();
			} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
			} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
			} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
			}
		}
	},
	
	// The actual function. 
	action: async function(){
		return new Promise(async function(resolve_o,reject_o){
			let start_ts = performance.now();

			// Set flags and display status.
			cwatch.inProgress=true;
			document.getElementById("cwatch_loading").innerText="BEGIN";

			// Generate a list from the local coins db.
			// let list = cwatch.coins.map(function(d){
			// 	return d.jsonmeta["coingecko.com"].id;
			// });
			let list = cwatch.coins;
			// list.unshift("bitcoin");
			// console.log(list.join(", "));
			let ts = (Math.random()*100000).toFixed(0);

			// Generate the url.
			let url = `getCwatchCharts?coingeckoids=${list.join(',')}&ts=${ts}`;

			// Make the request. 
			document.getElementById("cwatch_loading").innerText="REQUESTING";
			let resp;
			try{ resp = await m_fetch.getjson(url); }
			catch(e){
				resp = { error: e };
			}

			// Handle errors.
			if(resp.error){
				document.getElementById("cwatch_loading").innerText=`ERROR: ${resp.error}`;
				cwatch.inProgress=false;
				resolve_o();
				return; 
			}
			
			// Load the images.
			document.getElementById("cwatch_loading").innerText="LOADING: IMAGES";
			let proms = [];
			let frag = document.createDocumentFragment();

			// Auto-size to fit. 
			let cwatch_1  = document.getElementById("cwatch_1");
			let cols      = parseInt(cwatch_1.offsetWidth / (205+4));
			let rows      = parseInt(cwatch_1.offsetHeight / (160+4));
			let cssWidth  = Math.floor(cwatch_1.offsetWidth / cols) *0.95;
			let cssheight = Math.floor(cwatch_1.offsetHeight / rows)*0.95;
			let useAutoSize = false;
			
			// cwatch_1.offsetHeight;
			// cwatch_1.offsetWidth;

			for(let i=0; i<list.length; i+=1){
				// This is an effort to ensure that the coin widgets always appear in the specified order.
				// let rec = resp.find(function(r){ return r.coingeckoid == list[i]; });
				// if(!rec){ console.log("WARNING: Response did not include this coin:", list[i]); continue; }

				// Create the widget DOM.
				proms.push(
					new Promise(async function(res_i, rej_i){
						let rec = resp[i];
						let img = new Image();

						let div1 = document.createElement("div");
						div1.classList.add("cwatchDivContainer");
						// Create the hover title.
						div1.title = "CHANGE %:";
						let changes = rec.priceChangesPercent;
						// let changes = {
						// 	"1h"   : rec.priceChangesPercent["p_1h"],
						// 	"24h"  : rec.priceChangesPercent["p_24h"],
						// 	"* 7d" : rec.priceChangesPercent["p_7d"],
						// 	"14d"  : rec.priceChangesPercent["p_14d"],
						// 	"30d"  : rec.priceChangesPercent["p_30d"],
						// 	"200d" : rec.priceChangesPercent["p_200d"],
						// 	"1y"   : rec.priceChangesPercent["p_1y"],
						// };
						for(let k in changes){
							// Some of the values might not actually be there. 
							try{
								changes[k] = changes[k].toFixed(2).trim();
								changes[k] = changes[k].includes("-") ? (" - " + Math.abs(changes[k]) ) : (" + " + Math.abs(changes[k]) );
								div1.title += "\n  "+k+" : " + (changes[k] ) + "%";
							}
							catch(e){
								// console.log("MISSING DATA:", k, rec.coingeckoid);
							}
						}
						// Create canvas.
						let canvas = document.createElement("canvas");
						canvas.style["cursor"] = "pointer";
						canvas.addEventListener("click", function(){ window.open(rec.url, "_blank"); }, false);
						
						img.onload = function(){
							canvas.width = img.width;
							canvas.height = img.height;
							
							if(useAutoSize){
								canvas.style.width = cssWidth + "px";
								canvas.style.height = cssheight + "px";
							}
							
							let ctx = canvas.getContext('2d');
							ctx.imageSmoothingEnabled       = false;
							ctx.webkitImageSmoothingEnabled = false;
							ctx.mozImageSmoothingEnabled    = false;
							ctx.msImageSmoothingEnabled     = false;
							ctx.oImageSmoothingEnabled      = false;
							ctx.drawImage(img, 0, 0, img.width, img.height);
							res_i();
						};
						div1.appendChild(canvas);
						frag.appendChild(div1);
						img.src = rec.png;
					})
				);
			}
			
			await Promise.all(proms);

			// Clear the output just long enough for the user to notice there was an update.
			document.getElementById("cwatch_1").innerHTML = "";
			setTimeout(function(){
				// Display the images.
				document.getElementById("cwatch_1").appendChild(frag);
				
				let end_ts = performance.now();
				let totalTime = "" + ((end_ts-start_ts)/1000).toFixed(2) + " seconds";

				// Done.
				document.getElementById("cwatch_loading").innerText=`LOADED (in ${totalTime})`;
				cwatch.inProgress=false;
				resolve_o();
			}, 250);
			
		});
	},

	// Setup of the timed function. 
	init: async function(){
		cwatch.timerActive=true;
		cwatch.remaining = cwatch.defaultTime;
		cwatch.updateCountdownDisplay();

		await cwatch.action(); 

		clearTimeout(cwatch.timerId); 
		cwatch.timerId = setTimeout(cwatch.func, 1000);
	},

	// Runs on a timer. 
	func: async function(){
		// Skip if the flag is not set. 
		if (!cwatch.timerActive) { 
			console.log("timer not active."); 
			return; 
		}
		// Skip if an update is already in progress.
		if (cwatch.inProgress)   { 
			// console.log("Action is in progress."); 
			return; 
		}

		// Update the displayed remaining time. 
		cwatch.updateCountdownDisplay();

		// Check if the remaining time is now 0. 
		if (cwatch.remaining == 0) {
			// Skip if the cwatch view is not active.
			if(!document.getElementById("nav_view_cwatch").classList.contains("active") || document.hidden){

				// console.log("skipping");
				clearTimeout(cwatch.timerId); 
				cwatch.timerId = setTimeout(cwatch.func, 1000);
			}
			else{
				// Set a new timeout for 1 second from now.
				await cwatch.action(); 
				cwatch.remaining = cwatch.defaultTime;
				clearTimeout(cwatch.timerId); 
				cwatch.timerId = setTimeout(cwatch.func, 1000);
			}
		}
		else {
			// Decrement remaining timne. 
			cwatch.remaining -= 1;
			clearTimeout(cwatch.timerId); 
			cwatch.timerId = setTimeout(cwatch.func, 1000);
		}

	},

	// Update countdown display.
	updateCountdownDisplay: function(){
		// Determine hours, minutes, seconds. 
		let rSeconds     = cwatch.remaining;
		let hours        = Math.floor(rSeconds / 3600);
		let totalSeconds = rSeconds % 3600;
		let minutes      = Math.floor(totalSeconds / 60);
		let seconds      = totalSeconds % 60;

		// Format for display.
		hours   = hours.toFixed(0).padStart(2, "0");
		minutes = minutes.toFixed(0).padStart(2, "0");
		seconds = seconds.toFixed(0).padStart(2, "0");
		
		// Get the display string.
		let dispTime = hours + ":" + minutes + ":" + seconds;
	
		// Update the displayed remaining time. 
		document.getElementById("cwatch_countdown").innerText = dispTime;
	},

	// Changes the timer display. Starts/Stops the timed function.
	timerToggle : async function () {
		// DOM handle to the new value indicator. 
		if (cwatch.timerActive) {
			// Set the flag to false.
			cwatch.timerActive = false;
	
			// Change texts to "ON".
			document.getElementById("cwatch_timerActivate_newValue").innerText = "ON";

			document.getElementById("cwatch_loading").innerText="";
			clearTimeout(cwatch.timerId); 

			cwatch.remaining = cwatch.defaultTime;
			cwatch.updateCountdownDisplay();
		}
		else {
			// Set the flag to true.
			cwatch.timerActive = true;
			
			// Change texts to "OFF".
			document.getElementById("cwatch_timerActivate_newValue").innerText = "OFF";
			
			document.getElementById("cwatch_loading").innerText="";
			cwatch.init();
		}
	},

	addEventlisteners: function(){
		// Full-screen toggle.
		document.getElementById("toggleFullscreen").addEventListener("click", cwatch.toggleFullscreen, false);

		// Refresh button.
		document.getElementById("cwatch_refreshPage").addEventListener("click", function(){ window.location.reload(); }, false);

		// Timer button activation toggle.
		document.getElementById("cwatch_timerActivate").addEventListener("click", cwatch.timerToggle, false);

		// Turn the timer on.
		cwatch.timerToggle();
	},
};

window.onload = async function(){
	window.onload = null;

	let resp;
	let url = "getCoinList";
	try{ resp = await m_fetch.getjson(url); cwatch.coins = resp;}
	catch(e){ resp = { error: e }; }
	
	cwatch.addEventlisteners();

	// document.getElementById("getRoutePaths1").addEventListener("click", async function(){
	// 	let resp;
	// 	let url = "getRoutePaths?type=manual";
	// 	try{ resp = await m_fetch.getjson(url); cwatch.coins = resp;}
	// 	catch(e){ resp = { error: e }; }
	// 	console.log(resp);
	// }, false);
	// document.getElementById("getRoutePaths2").addEventListener("click", async function(){
	// 	let resp;
	// 	let url = "getRoutePaths?type=express";
	// 	try{ resp = await m_fetch.getjson(url); cwatch.coins = resp;}
	// 	catch(e){ resp = { error: e }; }
	// 	console.log(resp);
	// }, false);
	// document.getElementById("getRoutePaths3").addEventListener("click", async function(){
	// 	let resp;
	// 	let url = "getRoutePaths?type=both";
	// 	try{ resp = await m_fetch.getjson(url); cwatch.coins = resp;}
	// 	catch(e){ resp = { error: e }; }
	// 	console.log(resp);
	// }, false);
};