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
	let queuePositionModifiers = {};
	
	if (currentPosition <= 0) {
		currentPosition = 0;
		while (currentPosition >= start) {
			const slideKey = getSlideQueueRelativeKey(config[slideSet].queues.main, currentPosition);
			if (slideKey.startsWith('queue.')) {
				const queueKey = slideKey.slice(6);
				const subSlideKey = getSlideQueueRelativeKey(config[slideSet].queues[queueKey], queuePositionModifiers[queueKey] || -1);
				const subSlide = config[slideSet].definitions[subSlideKey];
				slides.unshift({ id: subSlideKey, position: currentAbsoluteSlidePosition + currentPosition, ...subSlide });
				queuePositionModifiers[queueKey] = (queuePositionModifiers[queueKey] || -1) - 1;
			}
			else {
				const slide = config[slideSet].definitions[slideKey];
				slides.unshift({ id: slideKey, position: currentAbsoluteSlidePosition + currentPosition, ...slide });
			}

			currentPosition -= 1;
		}

		currentPosition = 1;
	}
	
	queuePositionModifiers = {};
	while (currentPosition <= end) {
		const slideKey = getSlideQueueRelativeKey(config[slideSet].queues.main, currentPosition);
		if (slideKey.startsWith('queue.')) {
			const queueKey = slideKey.slice(6);
			const subSlideKey = getSlideQueueRelativeKey(config[slideSet].queues[queueKey], queuePositionModifiers[queueKey] || 0);
			const subSlide = config[slideSet].definitions[subSlideKey];
			slides.push({ id: subSlideKey, position: currentAbsoluteSlidePosition + currentPosition, ...subSlide });
			queuePositionModifiers[queueKey] = (queuePositionModifiers[queueKey] || 0) + 1;
		}
		else {
			const slide = config[slideSet].definitions[slideKey];
			slides.push({ id: slideKey, position: currentAbsoluteSlidePosition + currentPosition, ...slide });
		}
		
		currentPosition += 1;
	}

	return slides;
}

function updateKioskSlides() {
	io.to('kiosk').emit('slides.set', getSlideRelativeQueue(-1, 1));
}
function updateBottombarSlides() {
	io.to('kiosk').emit('bottombar.set', getSlideRelativeQueue(-1, 1, 'bottombar'));
}

function advanceSlide(slideSet = 'slides') {
	if (advanceSlideTimeout) clearTimeout(advanceSlideTimeout);

	const currentSlideKey = config[slideSet].queues.main.items[config[slideSet].queues.main.position];
	if (currentSlideKey.startsWith('queue.')) {
		const queueKey = currentSlideKey.slice(6);

		config[slideSet].queues[queueKey].position += 1;
		if (config[slideSet].queues[queueKey].position >= config[slideSet].queues[queueKey].items.length) config[slideSet].queues[queueKey].position = 0;
	}

	config[slideSet].queues.main.position += 1;
	if (config[slideSet].queues.main.position >= config[slideSet].queues.main.items.length) config[slideSet].queues.main.position = 0;

	currentAbsoluteSlidePosition += 1;

	saveConfig();

	if (slideSet === 'bottombar') updateBottombarSlides();
	else updateKioskSlides();

	advanceSlideTimeout = setTimeout(advanceSlide, config[slideSet].duration);
}
advanceSlideTimeout = setTimeout(advanceSlide, config.slides.duration);
advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), config.bottombar.duration);

function previousSlide(slideSet = 'slides') {
	if (slideSet === 'slides' && advanceSlideTimeout) clearTimeout(advanceSlideTimeout);
	else if (slideSet === 'bottombar' && advanceBottomBarTimeout) clearTimeout(advanceBottomBarTimeout);

	const currentSlideKey = confi[slideSet].queues.main.items[config[slideSet].queues.main.position];
	if (currentSlideKey.startsWith('queue.')) {
		const queueKey = currentSlideKey.slice(6);

		config[slideSet].queues[queueKey].position -= 1;
		if (config[slideSet].queues[queueKey].position < 0) config[slideSet].queues[queueKey].position = config[slideSet].queues[queueKey].items.length - 1;
	}

	config[slideSet].queues.main.position -= 1;
	if (config[slideSet].queues.main.position < 0) config[slideSet].queues.main.position = config[slideSet].queues.main.items.length - 1;

	currentAbsoluteSlidePosition -= 1;

	saveConfig();

	if (slideSet === 'bottombar') updateBottombarSlides();
	else updateKioskSlides();

	if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), config[slideSet].duration);
	else advanceSlideTimeout = setTimeout(advanceSlide, config[slideSet].duration);
}

io.on("connection", socket => {
	console.log('Connection Established');

	socket.on('login.kiosk', (password, callback) => {
		if (password === process.env.KIOSK_PASSWORD) {
			socket.join('kiosk');
			connectedKiosks.set(socket.id, true);

			socket.broadcast.to('adminconsole').emit('kiosk.connected');
			console.log('Kiosk connected');

			socket.on('slides.request', () => socket.emit('slides.set', getSlideRelativeQueue(-1, 1)));
			socket.on('bottombar.request', () => socket.emit('bottombar.set', getSlideRelativeQueue(-1, 1, 'bottombar')));

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

			socket.on('slides.next', () => advanceSlide());
			socket.on('slides.previous', () => previousSlide());
			socket.on('bottombar.next', () => advanceSlide('bottombar'));
			socket.on('bottombar.previous', () => previousSlide('bottombar'));

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