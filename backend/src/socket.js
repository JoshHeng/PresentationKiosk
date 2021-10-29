/**
 * Handles socket connection
 * 
 */
const { io } = require('./server');
const { config, isConfigUnloaded, unloadConfig, loadConfig, saveConfig } = require('./config');
const music = require('./music');
const slides = require('./slides');
const schedule = require('./schedule');
const socials = require('./socials');
const globalMode = require('./globalMode');

io.on("connection", socket => {
	console.log('Connection Established');

	// Kiosk Login
	socket.on('login.kiosk', (password, callback) => {
		if (password === process.env.KIOSK_PASSWORD) {
			socket.join('kiosk');

			socket.broadcast.to('adminconsole').emit('kiosk.connected');
			console.log('Kiosk connected');

			socket.on('slides.request', () => {
				socket.emit('slides.set', slides.getRelativeQueue(-1, 1));
				if (config.globalMode === 'blank') socket.emit('slides.cover', true);
			});
			socket.on('bottombar.request', () => {
				socket.emit('bottombar.set', slides.getRelativeQueue(-1, 1, 'bottombar'));
				if (config.globalMode === 'blank') socket.emit('bottombar.cover', '');
				else if (config.bottombar.announcement) socket.emit('bottombar.cover', config.bottombar.announcement);
			});
			socket.on('music.ended', music.nextSong);

			socket.emit('music.volume', config.music.volume, () => {
				socket.emit('music.load', config.music.queue[config.music.currentIndex], () => {
					socket.emit('music.play', !!(config.music.paused || config.globalMode !== 'play'), () => {
						socket.emit('music.load', config.music.queue[config.music.currentIndex + 1 >= config.music.queue.length ? 0 : config.music.currentIndex + 1]);
					});
				});
			});
			socket.on('schedule.request', () => socket.emit('schedule.set', {
				showCountdown:  config.globalMode === 'play' && config.schedule.showCountdown,
				events: config.schedule.events.slice(config.schedule.currentEventIndex, config.schedule.currentEventIndex + 5)
			}));

			return callback(true);
		}
		else return callback(false);
	});

	// Admin console login
	socket.on('login.adminconsole', (password, callback) => {
		if (password === process.env.ADMIN_CONSOLE_PASSWORD) {
			socket.join('adminconsole');

			socket.broadcast.to('adminconsole').emit('adminconsole.connected');
			console.log('Admin Console connected');

			socket.on('globalmode.set', mode => globalMode.set(mode));
			socket.on('globalmode.request', () => socket.emit('globalmode.change', config.globalMode))

			// Slides
			socket.on('slides.next', () => slides.advance());
			socket.on('slides.previous', () => slides.previous());
			socket.on('slides.request', () => {
				socket.emit('slides.set', slides.getRelativeQueue(0, 19))
				if (config.slides.paused) socket.emit('slides.pause');
			});
			socket.on('slides.togglepause', () => slides.togglePaused());

			// Bottom bar
			socket.on('bottombar.next', () => slides.advance('bottombar'));
			socket.on('bottombar.previous', () => slides.previous('bottombar'));
			socket.on('bottombar.request', () => {
				socket.emit('bottombar.set', slides.getRelativeQueue(0, 19, 'bottombar'));
				if (config.bottombar.paused) socket.emit('bottombar.pause');
				if (config.bottombar.announcement) socket.emit('bottombar.announcement', config.bottombar.announcement);
			});
			socket.on('bottombar.togglepause', () => slides.togglePaused('bottombar'));
			socket.on('bottombar.announce', (text, callback) => {
				if (!text && !config.bottombar.announcement) return callback('Please add something to announce');
				if (text.length > 256) return callback('Announcement too long');
				if (text === config.bottombar.announcement) return callback('Duplicate announcement');

				if (!text) {
					config.bottombar.announcement = '';
					saveConfig();
					if (config.globalMode !== 'blank') io.to('kiosk').emit('bottombar.cover', false);
					io.to('adminconsole').emit('bottombar.announcement', null);
					return callback();
				}
				else {
					config.bottombar.announcement = text;
					saveConfig();
					if (config.globalMode !== 'blank') io.to('kiosk').emit('bottombar.cover', config.bottombar.announcement);
					io.to('adminconsole').emit('bottombar.announcement', config.bottombar.announcement);
					return callback();
				}
			});

			// Music
			socket.on('music.volume.set', volume => {
				volume = parseInt(volume);
				if (isNaN(volume)) return;

				config.music.volume = volume/100;
				saveConfig();

				io.to('kiosk').emit('music.volume', config.music.volume);
				io.to('adminconsole').emit('music.volume', config.music.volume * 100);
			});
			socket.on('music.skip', music.nextSong);
			socket.on('music.toggle', () => music.togglePaused());

			// Schedule
			socket.on('schedule.request', () => socket.emit('schedule.set', config.schedule));
			socket.on('schedule.toggleCountdown', () => {
				config.schedule.showCountdown = !config.schedule.showCountdown;
				saveConfig();
				schedule.update();
			});
			socket.on('schedule.previous', () => {
				if (config.schedule.currentEventIndex <= 0) return;
				config.schedule.currentEventIndex -= 1;
				saveConfig();
				schedule.update();
			});
			socket.on('schedule.next', () => {
				if (config.schedule.currentEventIndex + 1 >= config.schedule.events.length) return;
				config.schedule.currentEventIndex += 1;
				saveConfig();
				schedule.update();
			});
			socket.on('schedule.edit', (events, callback) => {
				let check = schedule.validateEvents(events);
				if (check.error) return callback(check.error || 'An error occured');

				config.schedule.events = check.events;
				if (config.schedule.currentEventIndex >= config.schedule.events.length) config.schedule.currentEventIndex = 0;
				saveConfig();
				schedule.update();
				return callback();
			});

			// Config
			socket.on('config.setunloaded', status => {
				if (status === isConfigUnloaded()) return;

				if (status) unloadConfig();
				else loadConfig();
			});

			// Socials
			socket.on('bottombar.socials.request', callback => callback(socials.getPosts()));
			socket.on('bottombar.socials.edit', (data, callback) => {
				let result = socials.setPosts(data);
				if (result.error) return callback(result.error || 'An error occured');
				return callback();
			});

			// Emit current config
			socket.emit('music.volume', config.music.volume * 100);
			if (config.music.paused) socket.emit('music.pause');
			if (isConfigUnloaded()) socket.emit('config.unloaded', true);

			return callback(true);
		}
		else return callback(false);
	});

	// Disconnect
	socket.once('disconnect', () => {
		if (socket.in('adminconsole')) {
			console.log('Admin Console disconnected');
			socket.broadcast.to('adminconsole').emit('adminconsole.disconnected');
		}
		if (socket.in('kiosk')) {
			console.log('Kiosk disconnected');
			socket.broadcast.to('adminconsole').emit('kiosk.disconnected');
		}

		console.log('Socket Disconnected');
	})
});