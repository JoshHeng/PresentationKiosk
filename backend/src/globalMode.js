/**
 * Handles the global mode
 * 
 */
 const { io } = require('./server');
 const { config, saveConfig } = require('./config');
 const music = require('./music');
 const slides = require('./slides');
 const schedule = require('./schedule');

function set(mode) {
	if (mode !== 'play' && mode !== 'pause' && mode !== 'blank') return;
	if (config.globalMode === mode) return;

	const oldMode = config.globalMode;
	config.globalMode = mode;
	saveConfig();

	io.to('adminconsole').emit('globalmode.change', mode);
	let runTogglePause = false;

	switch (mode) {
		case 'play':
			if (oldMode === 'blank') io.to('kiosk').emit('slides.cover', false);
			if (oldMode === 'blank') io.to('kiosk').emit('bottombar.cover', config.bottombar.announcement || false);
			runTogglePause = true;
			break;

		case 'blank':
			io.to('kiosk').emit('slides.cover', true);
			io.to('kiosk').emit('bottombar.cover', '');
			if (oldMode === 'play') runTogglePause = true;
			break;

		case 'pause':
			if (oldMode === 'blank') io.to('kiosk').emit('slides.cover', false);
			if (oldMode === 'blank') io.to('kiosk').emit('bottombar.cover', config.bottombar.announcement || false);
			if (oldMode === 'play') runTogglePause = true;
			break;
	}

	if (runTogglePause) {
		slides.togglePaused('slides', false);
		slides.togglePaused('bottombar', false);
		music.togglePaused(false);
		schedule.update();
	}
}

module.exports = { set };