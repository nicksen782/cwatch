let timerActive = true;
let remaining = 5 * 60;
// let remaining = 10;

let timerId = undefined;
timerId = setInterval(function(){
	// Skip if the flag is not set. 
	if(!timerActive){ return; }

	// Calculates hours, minutes, seconds. Returns a formatted string.
	const getFormattedTimeRemaining = function(rSeconds){
		// Determine hours, minutes, seconds. 
		let hours = Math.floor(rSeconds / 3600);
		let totalSeconds = rSeconds % 3600;
		let minutes = Math.floor(totalSeconds / 60);
		let seconds = totalSeconds % 60;

		// Format for display.
		hours = hours.toFixed(0).padStart(2, "0");
		minutes = minutes.toFixed(0).padStart(2, "0");
		seconds = seconds.toFixed(0).padStart(2, "0");
		let dispTime = hours + ":" + minutes + ":" + seconds;

		// Return the value.
		return dispTime;
	};

	// Get the display string.
	let dispTime = getFormattedTimeRemaining(remaining);

	// Update the displayed remaining time. 
	document.getElementById("countdown").innerText = dispTime;

	// Check if the remaining time is now 0. 
	if(remaining == 0){
		// Clear the interval timer.
		clearInterval(timerId);

		// Set a new timeout for 1 second from now.
		setTimeout(function(){
			// Reload the page. 
			window.location.reload();
		}, 1000);
		return;
	}
	else{
		// Decrement remaining timne. 
		remaining -= 1;
	}

}, 1000);

const timer_activate = function(){
	// DOM handle to the new value indicator. 
	let newValue_span = document.getElementById("timerActivate_newValue");

	if(timerActive){
		// Set the flag to false.
		timerActive = false;
		
		// Change texts to "ON".
		newValue_span.innerText = "ON";
	}
	else{
		// Set the flag to true.
		timerActive = true;

		// Change texts to "OFF".
		newValue_span.innerText = "OFF";
	}
}

window.onload = function(){
	window.onload = null;
	
	// Timer button activation toggle.
	document.getElementById("timerActivate").addEventListener("click", timer_activate, false);
};