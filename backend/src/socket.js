/**
 * Handles socket connection
 *
 */
const { io } = require('./server');
const { config, unloadConfig, loadConfig, saveConfig } = require('./config');
const music = require('./music');
const slides = require('./slides');
const schedule = require('./schedule');
const socials = require('./socials');
const globalMode = require('./globalMode');

io.on('connection', socket => {
	console.log('Connection Established');

	// Kiosk Login
	socket.on('login.kiosk', (password, callback) => {
		if (password === process.env.KIOSK_PASSWORD) {
			socket.join('kiosk');
			socket.kiosk = true;

			socket.broadcast.to('adminconsole').emit('kiosk.connected');
			console.log('Kiosk connected');

			socket.on('slides.request', () => {
				socket.emit('slides.set', slides.getRelativeQueue(-1, 1));
				if (config.data.globalMode === 'blank') socket.emit('slides.cover', true);
			});
			socket.on('bottombar.request', () => {
				socket.emit('bottombar.set', slides.getRelativeQueue(-1, 1, 'bottombar'));
				if (config.data.globalMode === 'blank') socket.emit('bottombar.cover', '');
				else if (config.data.bottombar.announcement) socket.emit('bottombar.cover', config.data.bottombar.announcement);
			});
			socket.on('music.ended', music.nextSong);

			socket.emit('music.volume', config.data.music.volume, () => {
				socket.emit('music.load', config.data.music.queue[config.data.music.currentIndex], () => {
					// eslint-disable-next-line
					socket.emit('music.play', !!(config.data.music.paused || config.data.globalMode !== 'play'), () => {
						socket.emit('music.load', config.data.music.queue[config.data.music.currentIndex + 1 >= config.data.music.queue.length ? 0 : config.data.music.currentIndex + 1]);
					});
				});
			});
			socket.on('schedule.request', () => socket.emit('schedule.set', {
				showCountdown: config.data.globalMode === 'play' && config.data.schedule.showCountdown,
				showSchedule: !config.data.schedule.hideSchedule,
				events: config.data.schedule.events.slice(config.data.schedule.currentEventIndex, config.data.schedule.currentEventIndex + 5),
			}));

			return callback(true);
		}
		else {return callback(false);}
	});

	// Admin console login
	socket.on('login.adminconsole', (password, loginCallback) => {
		if (password === process.env.ADMIN_CONSOLE_PASSWORD) {
			socket.join('adminconsole');
			socket.adminconsole = true;

			socket.broadcast.to('adminconsole').emit('adminconsole.connected');
			console.log('Admin Console connected');

			socket.on('globalmode.set', mode => globalMode.set(mode));
			socket.on('globalmode.request', () => socket.emit('globalmode.change', config.data.globalMode));

			// Slides
			socket.on('slides.next', () => slides.advance());
			socket.on('slides.previous', () => slides.previous());
			socket.on('slides.request', () => {
				socket.emit('slides.set', slides.getRelativeQueue(0, 19));
				if (config.data.slides.paused) socket.emit('slides.pause');
			});
			socket.on('slides.togglepause', () => slides.togglePaused());

			// Bottom bar
			socket.on('bottombar.next', () => slides.advance('bottombar'));
			socket.on('bottombar.previous', () => slides.previous('bottombar'));
			socket.on('bottombar.request', () => {
				socket.emit('bottombar.set', slides.getRelativeQueue(0, 19, 'bottombar'));
				if (config.data.bottombar.paused) socket.emit('bottombar.pause');
				if (config.data.bottombar.announcement) socket.emit('bottombar.announcement', config.data.bottombar.announcement);
			});
			socket.on('bottombar.togglepause', () => slides.togglePaused('bottombar'));
			socket.on('bottombar.announce', (text, callback) => {
				if (!text && !config.data.bottombar.announcement) return callback('Please add something to announce');
				if (text.length > 256) return callback('Announcement too long');
				if (text === config.data.bottombar.announcement) return callback('Duplicate announcement');

				if (!text) {
					config.data.bottombar.announcement = '';
					saveConfig();
					if (config.data.globalMode !== 'blank') io.to('kiosk').emit('bottombar.cover', false);
					io.to('adminconsole').emit('bottombar.announcement', null);
					return callback();
				}
				else {
					config.data.bottombar.announcement = text;
					saveConfig();
					if (config.data.globalMode !== 'blank') io.to('kiosk').emit('bottombar.cover', config.data.bottombar.announcement);
					io.to('adminconsole').emit('bottombar.announcement', config.data.bottombar.announcement);
					return callback();
				}
			});

			// Music
			socket.on('music.volume.set', volume => {
				volume = parseInt(volume);
				if (isNaN(volume)) return;

				config.data.music.volume = volume / 100;
				saveConfig();

				io.to('kiosk').emit('music.volume', config.data.music.volume);
				io.to('adminconsole').emit('music.volume', config.data.music.volume * 100);
			});
			socket.on('music.skip', music.nextSong);
			socket.on('music.toggle', () => music.togglePaused());

			// Schedule
			socket.on('schedule.request', () => socket.emit('schedule.set', {
				...config.data.schedule,
				showSchedule: !config.data.schedule.hideSchedule
			}));
			socket.on('schedule.toggleCountdown', () => {
				config.data.schedule.showCountdown = !config.data.schedule.showCountdown;
				saveConfig();
				schedule.update();
			});
			socket.on('schedule.toggleSchedule', () => {
				config.data.schedule.hideSchedule = !config.data.schedule.hideSchedule;
				saveConfig();
				schedule.update();
			});
			socket.on('schedule.previous', () => {
				if (config.data.schedule.currentEventIndex <= 0) return;
				config.data.schedule.currentEventIndex -= 1;
				saveConfig();
				schedule.update();
			});
			socket.on('schedule.next', () => {
				if (config.data.schedule.currentEventIndex + 1 >= config.data.schedule.events.length) return;
				config.data.schedule.currentEventIndex += 1;
				saveConfig();
				schedule.update();
			});
			socket.on('schedule.edit', (events, callback) => {
				const check = schedule.validateEvents(events);
				if (check.error) return callback(check.error || 'An error occured');

				config.data.schedule.events = check.events;
				if (config.data.schedule.currentEventIndex >= config.data.schedule.events.length) config.data.schedule.currentEventIndex = 0;
				saveConfig();
				schedule.update();
				return callback();
			});

			// Config
			socket.on('config.setunloaded', status => {
				if (status === config.unloaded) return;

				if (status) unloadConfig();
				else loadConfig();
			});

			// Socials
			socket.on('bottombar.socials.request', callback => callback(socials.getPosts()));
			socket.on('bottombar.socials.edit', (data, callback) => {
				const result = socials.setPosts(data);
				if (result.error) return callback(result.error || 'An error occured');
				return callback();
			});

			// Emit current config
			socket.emit('music.volume', config.data.music.volume * 100);
			if (config.data.music.paused) socket.emit('music.pause');
			if (config.unloaded) socket.emit('config.data.unloaded', true);

			return loginCallback(true);
		}
		else {
			return loginCallback(false);
		}
	});

	// Disconnect
	socket.once('disconnect', () => {
		if (socket.adminconsole) {
			console.log('Admin Console disconnected');
			socket.broadcast.to('adminconsole').emit('adminconsole.disconnected');
		}
		if (socket.kiosk) {
			console.log('Kiosk disconnected');
			socket.broadcast.to('adminconsole').emit('kiosk.disconnected');
		}

		console.log('Socket Disconnected');
	});
});