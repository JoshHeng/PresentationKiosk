/**
 * Handles configuration
 *
 */
const fs = require('fs');
const { io } = require('./server');

let configUnloaded = false;

// Load configuration
if (!fs.existsSync('./config.json')) fs.copyFileSync('./defaultConfig.json', './config.json');
let config = JSON.parse(fs.readFileSync('./config.json'));

/**
 * Save configuration file
 */
function saveConfig() {
	if (!configUnloaded) fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

/**
 * Unload config
 */
function unloadConfig() {
	console.log('Unloading config');
	configUnloaded = true;
	console.log('Config unloaded');
	io.to('adminconsole').emit('config.unloaded', true);
}

/**
 * Load config
 */
function loadConfig() {
	console.log('Reloading config');
	configUnloaded = false;
	config = JSON.parse(fs.readFileSync('./config.json'));
	console.log('Config reloaded');
	io.to('adminconsole').emit('config.unloaded', false);
}

/**
 * Return if the config is unloaded
 * @returns {Boolean} Unloaded?
 */
function isConfigUnloaded() {
	return configUnloaded;
}

module.exports = { config, saveConfig, unloadConfig, loadConfig, isConfigUnloaded };