/**
 * Handles music 
 * 
 */
const { io } = require('./server');
const { config, saveConfig } = require('./config');

/**
 * Toggle whether the music is paused
 * @param {Boolean} toggle Whether to toggle the music 
 */
function togglePaused(toggle = true) {
	if (toggle) {
		config.music.paused = !config.music.paused;
		saveConfig();
	}

	if (config.globalMode !== 'play' || config.music.paused) {
		io.to('kiosk').emit('music.pause');
		io.to('adminconsole').emit('music.pause');
	}
	else {
		io.to('kiosk').emit('music.resume');
		io.to('adminconsole').emit('music.resume');
	}
}

/**
 * Switch to the next song
 */
function nextSong() {
	config.music.currentIndex += 1;
	if (config.music.currentIndex >= config.music.queue.length) config.music.currentIndex = 0;

	saveConfig();

	io.to('kiosk').emit('music.play', !!config.music.paused);
	setTimeout(() => {
		io.to('kiosk').emit('music.load', config.music.queue[config.music.currentIndex + 1 >= config.music.queue.length ? 0 : config.music.currentIndex + 1])
	}, 500);
}

module.exports = { togglePaused, nextSong };