const fs = require('fs');
// const path = require('path');

let _APP = null;

let _MOD = {
	configFilename : "srvConfig.json",
	config : {},

	coinDataFilename : "coinData.json",
	coinData : {},

	// Init this module.
	module_init: function(parent){
		// Save reference to ledger.
		_APP = parent;
	
		// Get the config file. 
		_MOD.getConfig_file();

		// Add routes.
		_MOD.addRoutes(_APP.app, _APP.express);
	},

	// Adds routes for this module.
	addRoutes: function(app, express){
	},

	getConfig_file : async function(){
		_MOD.config = await JSON.parse( fs.readFileSync(_MOD.configFilename, 'utf8'));
		_MOD.config["_serverFilePath"] = process.cwd() 
		_MOD.config["_ppid"]           = process.ppid ;
		_MOD.config["_pid" ]           = process.pid;
		_MOD.config["_serverStarted"]  = `${new Date().toString().split(" GMT")[0]} `; // Thu Sep 30 2021 17:04:35
		return _MOD.config;
	},
	
	getConfig_ram : function(){
		return _MOD.config;
	},
	
	updateConfigFile : async function(newJson=_MOD.config){
		fs.writeFileSync(_MOD.configFilename, JSON.stringify(newJson, null,1));
	},
	
	getCoinData_file : async function(){
		_MOD.coinData = await JSON.parse( fs.readFileSync(_MOD.coinDataFilename, 'utf8'));
		return _MOD.coinData;
	},
	
	getCoinData_ram : function(){
		return _MOD.coinData;
	},
	
	updateCoinDataFile : async function(newJson=_MOD.coinData){
		fs.writeFileSync(_MOD.coinDataFilename, JSON.stringify(newJson, null,1));
	},
};



module.exports = _MOD;