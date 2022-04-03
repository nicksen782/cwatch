const express = require('express'); // npm install express
const app     = express();
const path    = require('path');
const fs      = require('fs');

// Modules (includes routes.)
const _APP   = require('./modules/M_main.js')(app, express);

// START THE SERVER.
(async function startServer() {
	// Main app init
	await _APP.module_inits();

	let conf = {
		port       : _APP.m_config.getConfig_ram().port,
		host       : _APP.m_config.getConfig_ram().host,
	};

	// Remove any existing processes that are using this port.
	// await require( '../removeprocess.js' )( conf.port ); 

	// Start the server.
	app.listen(
		{
			port       : conf.port, // port <number>
			host       : conf.host, // host <string>
			// path       : ""   , // path        <string>      Will be ignored if port is specified. See Identifying paths for IPC connections.
			// backlog    : 0    , // backlog     <number>      Common parameter of server.listen() functions.
			// exclusive  : false, // exclusive   <boolean>     Default: false
			// readableAll: false, // readableAll <boolean>     For IPC servers makes the pipe readable for all users. Default: false.
			// writableAll: false, // writableAll <boolean>     For IPC servers makes the pipe writable for all users. Default: false.
			// ipv6Only   : false, // ipv6Only    <boolean>     For TCP servers, setting ipv6Only to true will disable dual-stack support, i.e., binding to host :: won't make 0.0.0.0 be bound. Default: false.
			// signal     : null , // signal      <AbortSignal> An AbortSignal that may be used to close a listening server.	
		}, 
		async function() {
			process.title = "cwatch_standalone";
			
			app.use('/'    , express.static(path.join(process.cwd(), './public')));
			app.use('/libs', express.static(path.join(process.cwd(), './node_modules')));
			
			console.log();
			console.log("*".repeat(40));
			console.log(`NAME    : ${process.title}`);
			console.log(`STARTDIR: ${process.cwd()}`);
			console.log(`SERVER  : ${conf.host}:${conf.port}`);
			console.log(_APP.m_config.getConfig_ram());
			console.log("*".repeat(40));
			console.log();
		}
	);
})();