require('dotenv').config();

const fs = require('fs');
const app = require("express")();
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST']
	}
});

const connectedKiosks = new Map();
const connectedAdminConsoles = new Map();

// Load configuration
if (!fs.existsSync('./config.json')) fs.copyFileSync('./defaultConfig.json', './config.json');
const config = JSON.parse(fs.readFileSync('./config.json'));

var currentAbsoluteSlidePosition = 0;
var currentAbsoluteBottomBarPosition = 0;
var advanceSlideTimeout = null;
var advanceBottomBarTimeout = null;

function saveConfig() {
	fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
}

// Slides
function getSlideQueueRelativeKey(queue, relativePosition) {
	const queueLength = queue.items.length;
	position = queue.position + relativePosition;

	if (queueLength === 0) return null;

	if (position < 0) {
		while (position < 0) {
			position += queueLength;
		}
	}
	if (position >= queueLength) {
		while (position >= queueLength) {
			position -= queueLength;
		}
	}
	
	return queue.items[position];
}
function getSlideRelativeQueue(start, end, slideSet = 'slides') {
	if (end < start) return [];
	if (end < 0) end = 0;

	let currentPosition = start;
	const slides = [];
	const currentAbsolutePosition = slideSet === 'bottombar' ? currentAbsoluteBottomBarPosition : currentAbsoluteSlidePosition;
	let queuePositionModifiers = {};
	let currentQueue;
	
	if (currentPosition <= 0) {
		currentPosition = 0;
		while (currentPosition >= start) {
			const slideKey = getSlideQueueRelativeKey(config[slideSet].queues.main, currentPosition);
			if (slideKey.startsWith('queue.')) {
				const queueKey = slideKey.slice(6);
				if (currentPosition === 0) currentQueue = queueKey;
				const subSlideKey = getSlideQueueRelativeKey(config[slideSet].queues[queueKey], queuePositionModifiers[queueKey] || (currentPosition === 0 ? 0 : -1));
				const subSlide = config[slideSet].definitions[subSlideKey];
				slides.unshift({ id: subSlideKey, duration: (subSlide.duration || config[slideSet].queues[queueKey].duration || config[slideSet].duration), durationType: subSlide.duration ? 'slide' : (config[slideSet].queues[queueKey].duration ? 'queue' : 'default'), queue: queueKey, position: currentAbsolutePosition + currentPosition, ...subSlide });
				queuePositionModifiers[queueKey] = (queuePositionModifiers[queueKey] || (currentPosition === 0 ? 0 : -1)) - 1;
			}
			else {
				const slide = config[slideSet].definitions[slideKey];
				slides.unshift({ id: slideKey, duration: (slide.duration || config[slideSet].duration), durationType: slide.duration ? 'slide' : 'default', position: currentAbsolutePosition + currentPosition, ...slide });
			}

			currentPosition -= 1;
		}

		currentPosition = 1;
	}
	
	queuePositionModifiers = {};
	if (currentQueue) queuePositionModifiers[currentQueue] = 1;

	while (currentPosition <= end) {
		const slideKey = getSlideQueueRelativeKey(config[slideSet].queues.main, currentPosition);
		if (slideKey.startsWith('queue.')) {
			const queueKey = slideKey.slice(6);
			const subSlideKey = getSlideQueueRelativeKey(config[slideSet].queues[queueKey], queuePositionModifiers[queueKey] || 0);
			const subSlide = config[slideSet].definitions[subSlideKey];
			slides.push({ id: subSlideKey, duration: (subSlide.duration || config[slideSet].queues[queueKey].duration || config[slideSet].duration), durationType: subSlide.duration ? 'slide' : (config[slideSet].queues[queueKey].duration ? 'queue' : 'default'), queue: queueKey, position: currentAbsolutePosition + currentPosition, ...subSlide });
			queuePositionModifiers[queueKey] = (queuePositionModifiers[queueKey] || 0) + 1;
		}
		else {
			const slide = config[slideSet].definitions[slideKey];
			slides.push({ id: slideKey, duration: (slide.duration || config[slideSet].duration), durationType: slide.duration ? 'slide' : 'default', position: currentAbsolutePosition + currentPosition, ...slide });
		}
		
		currentPosition += 1;
	}

	return slides;
}

function updateKioskSlides() {
	io.to('kiosk').emit('slides.set', getSlideRelativeQueue(-1, 1));
	io.to('adminconsole').emit('slides.set', getSlideRelativeQueue(0, 19));
}
function updateBottombarSlides() {
	io.to('kiosk').emit('bottombar.set', getSlideRelativeQueue(-1, 1, 'bottombar'));
	io.to('adminconsole').emit('bottombar.set', getSlideRelativeQueue(0, 19, 'bottombar'));
}

function advanceSlide(slideSet = 'slides') {
	if (slideSet === 'slides' && advanceSlideTimeout) {
		clearTimeout(advanceSlideTimeout);
		advanceSlideTimeout = null;
	}
	else if (slideSet === 'bottombar' && advanceBottomBarTimeout) {
		clearTimeout(advanceBottomBarTimeout);
		advanceSlideTimeout = null;
	}

	const currentSlideKey = config[slideSet].queues.main.items[config[slideSet].queues.main.position];
	if (currentSlideKey.startsWith('queue.')) {
		const queueKey = currentSlideKey.slice(6);

		config[slideSet].queues[queueKey].position += 1;
		if (config[slideSet].queues[queueKey].position >= config[slideSet].queues[queueKey].items.length) config[slideSet].queues[queueKey].position = 0;
	}

	config[slideSet].queues.main.position += 1;
	if (config[slideSet].queues.main.position >= config[slideSet].queues.main.items.length) config[slideSet].queues.main.position = 0;

	if (slideSet === 'bottombar') currentAbsoluteBottomBarPosition += 1;
	else currentAbsoluteSlidePosition += 1;

	saveConfig();

	if (slideSet === 'bottombar') updateBottombarSlides();
	else updateKioskSlides();

	if (config.globalMode === 'play' && !config[slideSet].paused) {
		const currentSlide = getSlideRelativeQueue(0, 0, slideSet)[0];

		if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), currentSlide.duration);
		else advanceSlideTimeout = setTimeout(advanceSlide, currentSlide.duration);
	}
}
if (config.globalMode === 'play' && !config.slides.paused) advanceSlideTimeout = setTimeout(advanceSlide, config.slides.duration);
if (config.globalMode === 'play' && !config.bottombar.paused) advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), config.bottombar.duration);

function previousSlide(slideSet = 'slides') {
	if (slideSet === 'slides' && advanceSlideTimeout) {
		clearTimeout(advanceSlideTimeout);
		advanceSlideTimeout = null;
	}
	else if (slideSet === 'bottombar' && advanceBottomBarTimeout) {
		clearTimeout(advanceBottomBarTimeout);
		advanceSlideTimeout = null;
	}

	const currentSlideKey = config[slideSet].queues.main.items[config[slideSet].queues.main.position];
	if (currentSlideKey.startsWith('queue.')) {
		const queueKey = currentSlideKey.slice(6);

		config[slideSet].queues[queueKey].position -= 1;
		if (config[slideSet].queues[queueKey].position < 0) config[slideSet].queues[queueKey].position = config[slideSet].queues[queueKey].items.length - 1;
	}

	config[slideSet].queues.main.position -= 1;
	if (config[slideSet].queues.main.position < 0) config[slideSet].queues.main.position = config[slideSet].queues.main.items.length - 1;

	if (slideSet === 'bottombar') currentAbsoluteBottomBarPosition -= 1;
	else currentAbsoluteSlidePosition -= 1;

	saveConfig();

	if (slideSet === 'bottombar') updateBottombarSlides();
	else updateKioskSlides();

	if (config.globalMode === 'play' && !config[slideSet].paused) {
		const currentSlide = getSlideRelativeQueue(0, 0, slideSet)[0];

		if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), currentSlide.duration);
		else advanceSlideTimeout = setTimeout(advanceSlide, currentSlide.duration);
	}
}
function toggleSlidesPaused(slideSet = 'slides', toggle = true) {
	if (toggle) {
		config[slideSet].paused = !config[slideSet].paused;
		saveConfig();
	}

	if (config.globalMode !== 'play' || config[slideSet].paused) {
		if (slideSet === 'slides' && advanceSlideTimeout) {
			clearTimeout(advanceSlideTimeout);
			advanceSlideTimeout = null;
		}
		else if (slideSet === 'bottombar' && advanceBottomBarTimeout) {
			clearTimeout(advanceBottomBarTimeout);
			advanceSlideTimeout = null;
		}
		
		if (slideSet === 'slides') io.to('adminconsole').emit('slides.pause');
		else io.to('adminconsole').emit('bottombar.pause');
	}
	else {
		const currentSlide = getSlideRelativeQueue(0, 0, slideSet)[0];

		if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), currentSlide.duration);
		else advanceSlideTimeout = setTimeout(advanceSlide, currentSlide.duration);

		if (slideSet === 'slides') io.to('adminconsole').emit('slides.resume');
		else io.to('adminconsole').emit('bottombar.resume');
	}
}

function toggleMusicPause(toggle = true) {
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

function nextSong() {
	config.music.currentIndex += 1;
	if (config.music.currentIndex >= config.music.queue.length) config.music.currentIndex = 0;

	saveConfig();

	io.to('kiosk').emit('music.play', !!config.music.paused);
	setTimeout(() => io.to('kiosk').emit('music.load', config.music.queue[config.music.currentIndex + 1 >= config.music.queue.length ? 0 : config.music.currentIndex + 1]), 500);
}

function updateSchedule() {
	io.to('kiosk').emit('schedule.set', {
		showCountdown: config.globalMode === 'play' && config.schedule.showCountdown,
		events: config.schedule.events.slice(config.schedule.currentEventIndex, config.schedule.currentEventIndex + 5)
	});
	io.to('adminconsole').emit('schedule.set', config.schedule);
}

function checkEvents(events) {
	const newEvents = [];

	try {
		for (const event of events) {
			if (!event.startsAt) return { error: 'Missing start time' };
			if (!event.title) return { error: 'Missing title' };
			if (!event.time) return { error: 'Missing time' };

			event.startsAt = parseInt(event.startsAt);
			if (isNaN(event.startsAt)) return { error: 'Invalid start time' }

			newEvents.push({
				startsAt: event.startsAt,
				title: event.title.slice(0, 256),
				time: event.time.slice(0, 32)
			});
		}

		return { events: newEvents }
	}
	catch(err) {
		console.error(err);
		return { error: 'Invalid' }
	}
}

function setGlobalMode(mode) {
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
			if (oldMode === 'blank') io.to('kiosk').emit('bottombar.cover', false);
			runTogglePause = true;
			break;

		case 'blank':
			io.to('kiosk').emit('slides.cover', true);
			io.to('kiosk').emit('bottombar.cover', '');
			if (oldMode === 'play') runTogglePause = true;
			break;

		case 'pause':
			if (oldMode === 'blank') io.to('kiosk').emit('slides.cover', false);
			if (oldMode === 'blank') io.to('kiosk').emit('bottombar.cover', false);
			if (oldMode === 'play') runTogglePause = true;
			break;
	}

	if (runTogglePause) {
		toggleSlidesPaused('slides', false);
		toggleSlidesPaused('bottombar', false);
		toggleMusicPause(false);
		updateSchedule();
	}
}

io.on("connection", socket => {
	console.log('Connection Established');

	socket.on('login.kiosk', (password, callback) => {
		if (password === process.env.KIOSK_PASSWORD) {
			socket.join('kiosk');
			connectedKiosks.set(socket.id, true);

			socket.broadcast.to('adminconsole').emit('kiosk.connected');
			console.log('Kiosk connected');

			socket.on('slides.request', () => {
				socket.emit('slides.set', getSlideRelativeQueue(-1, 1));
				if (config.globalMode === 'blank') socket.emit('slides.cover', true);
			});
			socket.on('bottombar.request', () => {
				socket.emit('bottombar.set', getSlideRelativeQueue(-1, 1, 'bottombar'));
				if (config.globalMode === 'blank') socket.emit('bottombar.cover', '');
			});
			socket.on('music.ended', nextSong);

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
	socket.on('login.adminconsole', (password, callback) => {
		if (password === process.env.ADMIN_CONSOLE_PASSWORD) {
			socket.join('adminconsole');
			connectedAdminConsoles.set(socket.id, true);

			socket.broadcast.to('adminconsole').emit('adminconsole.connected');
			console.log('Admin Console connected');

			socket.on('globalmode.set', mode => setGlobalMode(mode));
			socket.on('globalmode.request', () => socket.emit('globalmode.change', config.globalMode))

			socket.on('slides.next', () => advanceSlide());
			socket.on('slides.previous', () => previousSlide());
			socket.on('slides.request', () => {
				socket.emit('slides.set', getSlideRelativeQueue(0, 19))
				if (config.slides.paused) socket.emit('slides.pause');
			});
			socket.on('slides.togglepause', () => toggleSlidesPaused());

			socket.on('bottombar.next', () => advanceSlide('bottombar'));
			socket.on('bottombar.previous', () => previousSlide('bottombar'));
			socket.on('bottombar.request', () => {
				socket.emit('bottombar.set', getSlideRelativeQueue(0, 19, 'bottombar'));
				if (config.bottombar.paused) socket.emit('bottombar.pause');
			});
			socket.on('bottombar.togglepause', () => toggleSlidesPaused('bottombar'));

			socket.on('music.volume.set', volume => {
				volume = parseInt(volume);
				if (isNaN(volume)) return;

				config.music.volume = volume/100;
				saveConfig();

				io.to('kiosk').emit('music.volume', config.music.volume);
				io.to('adminconsole').emit('music.volume', config.music.volume * 100);
			});
			socket.on('music.skip', nextSong);
			socket.on('music.toggle', () => toggleMusicPause());

			socket.on('schedule.request', () => socket.emit('schedule.set', config.schedule));
			socket.on('schedule.toggleCountdown', () => {
				config.schedule.showCountdown = !config.schedule.showCountdown;
				saveConfig();
				updateSchedule();
			});
			socket.on('schedule.previous', () => {
				if (config.schedule.currentEventIndex <= 0) return;
				config.schedule.currentEventIndex -= 1;
				saveConfig();
				updateSchedule();
			});
			socket.on('schedule.next', () => {
				if (config.schedule.currentEventIndex + 1 >= config.schedule.events.length) return;
				config.schedule.currentEventIndex += 1;
				saveConfig();
				updateSchedule();
			});
			socket.on('schedule.edit', (events, callback) => {
				let check = checkEvents(events);
				if (check.error) return callback(check.error || 'An error occured');

				config.schedule.events = check.events;
				if (config.schedule.currentEventIndex >= config.schedule.events.length) config.schedule.currentEventIndex = 0;
				saveConfig();
				updateSchedule();
				return callback();
			});

			socket.emit('music.volume', config.music.volume * 100);
			if (config.music.paused) socket.emit('music.pause');

			return callback(true);
		}
		else return callback(false);
	});

	socket.once('disconnect', () => {
		if (connectedKiosks.has(socket.id)) {
			connectedKiosks.delete(socket.id);
			socket.broadcast.to('adminconsole').emit('kiosk.disconnected');
			console.log('Kiosk disconnected');
		}
		if (connectedAdminConsoles.has(socket.id)) {
			connectedAdminConsoles.delete(socket.id);
			socket.broadcast.to('adminconsole').emit('adminconsole.disconnected');
			console.log('Admin Console disconnected');
		}

		console.log('Connection Disconnected');
	})
});

httpServer.listen(3001, () => {
	console.log('Backend Listening');
});