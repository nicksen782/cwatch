const node_fetch   = require('node-fetch');
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
	},

	// Wrapper function for node_fetch.
	send : async function(url, options){
		return new Promise(async function(resolve,reject){
		
			// Set default options if they were not provided.
			if(!options){
				console.log("options was not specified.");
				options = {
					"crossDomain": true,
					"muteHttpExceptions": true,
					"async": true,
					"method": "GET",
					"headers": {
						'Accept': 'application/json',
						'Content-Type': 'application/json',
					},
					"body": JSON.stringify("") // Needs to be JSON even if blank.
				};
			}

			// Do the node_fetch as text.
			if(options.headers["Content-Type"] != "application/json"){
				node_fetch(url, options)
				.then(res => res.text())
				.then(text => { resolve(text); })
				.catch(err => {
					console.log("ERROR: node_fetch: text:", err, "**\n**\n");
					reject(err);
				})
				;
			}
			// Do the node_fetch as json.
			else{
				node_fetch(url, options)
					// Convert to JSON and return the JSON.
					.then(res => res.json())
					.then(json => { resolve(json); })
					.catch(err => {
						console.log("ERROR: node_fetch: json: ", err, "**\n**\n");
						reject(err);
					})
				;
			}
		});
	},

	// Direct access to node_fetch.
	fetch: node_fetch,
};

module.exports = _MOD;