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
		config.data.music.paused = !config.data.music.paused;
		saveConfig();
	}

	if (config.data.globalMode !== 'play' || config.data.music.paused) {
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
	config.data.music.currentIndex += 1;
	if (config.data.music.currentIndex >= config.data.music.queue.length) config.data.music.currentIndex = 0;

	saveConfig();

	io.to('kiosk').emit('music.play', !!config.data.music.paused);
	setTimeout(() => {
		io.to('kiosk').emit('music.load', config.data.music.queue[config.data.music.currentIndex + 1 >= config.data.music.queue.length ? 0 : config.data.music.currentIndex + 1]);
	}, 500);
}

module.exports = { togglePaused, nextSong };