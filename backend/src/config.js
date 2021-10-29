/**
 * Handles configuration
 *
 */
const fs = require('fs');
const { io } = require('./server');

// Load configuration
if (!fs.existsSync('./config.json')) fs.copyFileSync('./defaultConfig.json', './config.json');
const config = {
	unloaded: false,
	data: JSON.parse(fs.readFileSync('./config.json')),
};

/**
 * Save configuration file
 */
function saveConfig() {
	if (!config.unloaded) fs.writeFileSync('./config.json', JSON.stringify(config.data, null, 2));
}

/**
 * Unload config
 */
function unloadConfig() {
	console.log('Unloading config');
	config.unloaded = true;
	console.log('Config unloaded');
	io.to('adminconsole').emit('config.unloaded', true);
}

/**
 * Load config
 */
function loadConfig() {
	console.log('Reloading config');
	config.unloaded = false;
	config.data = JSON.parse(fs.readFileSync('./config.json'));
	console.log('Config reloaded');
	io.to('adminconsole').emit('config.unloaded', false);
}

module.exports = { config, saveConfig, unloadConfig, loadConfig };