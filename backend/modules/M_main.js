const fs = require('fs');
const path = require('path'); 

// CWATCH
const fromExponential = require('from-exponential');
const { createCanvas, loadImage, Image } = require('canvas')
let Chart = require('chart.js');

const m_config = require('./m_config.js');
const m_fetch  = require('./m_fetch.js');
const m_cwatch = require('./m_cwatch.js');

let _APP = {
	// Express variables.
	app    : null,
	express: null,

	// Manual route list. (Emulates something like route annotations.)
	routeList: {}, 

	// MODULES (_APP will have access to all the modules.)
	m_config    : m_config ,
	m_fetch     : m_fetch ,
	m_cwatch    : m_cwatch ,

	// Init this module.
	module_init: function(parent){
		// Save reference to _APP.
		// _APP = parent;
	
		// Add routes.
		_APP.addRoutes(_APP.app, _APP.express);

		// Get the coinData file. 
		_APP.m_config.getCoinData_file();
	},

	// Adds routes for this module.
	addRoutes: function(app, express){
		// Outputs a list of registered routes.
		_APP.addToRouteList({ path: "/getRoutePaths", method: "get", args: ['type'], file: __filename, desc: "Outputs a list of manually registered routes." });
		app.get('/getRoutePaths'    ,express.json(), async (req, res) => {
			let resp = _APP.getRoutePaths(req.query.type, app); 
			res.json(resp);
		});
	},

	// Add the _APP object to each required object.
	module_inits: function(){
		return new Promise(function(resolve,reject){
			_APP         .module_init(_APP);
			_APP.m_config.module_init(_APP);
			_APP.m_fetch .module_init(_APP);
			_APP.m_cwatch.module_init(_APP);
			resolve();
		});
	},

	// ROUTED: Outputs a list of registered routes.
	getRoutePaths : function(type="manual", app){
		let routes = app._router.stack.filter(r => r.route).map(r => r.route).map(function(r){
			let methods = [];
			for(let m in r.methods){
				methods.push(m);
			}
			return {
				method: methods.join(" "),
				path: r.path,
			};
		});

		switch(type){
			case "manual" : 
				return {
					manual: _APP.routeList,
				};
				break; 

			case "express": 
				return {
					express: routes,
				};
				break; 

			case "both"   : 
				// TODO: unmatched
				return {
					manual   : _APP.routeList,
					express : routes,
					unmatched: [],
				};
				break; 

			default: break; 
		}

		if(type=="manual"){
		}
	},

	// Adds a manual route entry to the routeList.
	addToRouteList : function(obj){
		let file = path.basename(obj.file);
		if(!_APP.routeList[file]){ _APP.routeList[file] = []; }
		_APP.routeList[file].push({
			path  : obj.path, 
			method: obj.method, 
			args  : obj.args,
			desc  : obj.desc,
		});
	},
};

// Save app and express to _APP and then return _APP.
module.exports = function(app, express){
	_APP.app     = app;
	_APP.express = express;
	return _APP;
};