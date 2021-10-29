/**
 * Handles slides 
 * 
 */
const { io } = require('./server');
const { config, saveConfig } = require('./config');

let currentAbsoluteSlidePosition = 0;
let currentAbsoluteBottomBarPosition = 0;
let advanceSlideTimeout = null;
let advanceBottomBarTimeout = null;

/**
 * Update slides on the clients
 * @param {String} slideSet
 */
function update(slideSet = 'slides') {
	io.to('kiosk').emit('slides.set', getSlideRelativeQueue(-1, 1, slideSet));
	io.to('adminconsole').emit('slides.set', getSlideRelativeQueue(0, 19, slideSet));
}


/**
 * Advance to the next side
 * @param {String} slideSet
 */
function advance(slideSet = 'slides') {
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
	update(slideSet);

	if (config.globalMode === 'play' && !config[slideSet].paused) {
		const currentSlide = getSlideRelativeQueue(0, 0, slideSet)[0];

		if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), currentSlide.duration);
		else advanceSlideTimeout = setTimeout(advanceSlide, currentSlide.duration);
	}
}

/**
 * Go back to the previous slide
 * @param {String} slideSet 
 */
function previous(slideSet = 'slides') {
	if (slideSet === 'slides' && advanceSlideTimeout) {
		clearTimeout(advanceSlideTimeout);
		advanceSlideTimeout = null;
	}
	else if (slideSet === 'bottombar' && advanceBottomBarTimeout) {
		clearTimeout(advanceBottomBarTimeout);
		advanceSlideTimeout = null;
	}

	const lastSlide = getSlideRelativeQueue(-1, -1, slideSet)[0];
	if (lastSlide.queue) {
		config[slideSet].queues[lastSlide.queue].position -= 1;
		if (config[slideSet].queues[lastSlide.queue].position < 0) config[slideSet].queues[lastSlide.queue].position = config[slideSet].queues[lastSlide.queue].items.length - 1;
	}

	config[slideSet].queues.main.position -= 1;
	if (config[slideSet].queues.main.position < 0) config[slideSet].queues.main.position = config[slideSet].queues.main.items.length - 1;

	if (slideSet === 'bottombar') currentAbsoluteBottomBarPosition -= 1;
	else currentAbsoluteSlidePosition -= 1;

	saveConfig();
	update(slideSet);

	if (config.globalMode === 'play' && !config[slideSet].paused) {
		const currentSlide = getSlideRelativeQueue(0, 0, slideSet)[0];

		if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), currentSlide.duration);
		else advanceSlideTimeout = setTimeout(advanceSlide, currentSlide.duration);
	}
}

/**
 * Toggle if the slides are paused
 * @param {String} slideSet
 * @param {Boolean} toggle
 */
function togglePaused(slideSet = 'slides', toggle = true) {
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

/**
 * Get the relative slide queue
 * @param {Number} start 
 * @param {Number} end 
 * @param {String} slideSet 
 * @returns {Object[]} Queued slides
 */
function getRelativeQueue(start, end, slideSet = 'slides') {
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
			const slideKey = getQueueRelativeKey(config[slideSet].queues.main, currentPosition);
			if (slideKey.startsWith('queue.')) {
				const queueKey = slideKey.slice(6);
				if (currentPosition === 0) currentQueue = queueKey;
				const subSlideKey = getQueueRelativeKey(config[slideSet].queues[queueKey], queuePositionModifiers[queueKey] || (currentPosition === 0 ? 0 : -1));
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
		const slideKey = getQueueRelativeKey(config[slideSet].queues.main, currentPosition);
		if (slideKey.startsWith('queue.')) {
			const queueKey = slideKey.slice(6);
			const subSlideKey = getQueueRelativeKey(config[slideSet].queues[queueKey], queuePositionModifiers[queueKey] || 0);
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

/**
 * Get the key of the slide from the queue and relative position
 * @param {Object} queue
 * @param {Integer} relativePosition
 */
 function getQueueRelativeKey(queue, relativePosition) {
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

// Start the slides if not paused
if (config.globalMode === 'play' && !config.slides.paused) advanceSlideTimeout = setTimeout(advanceSlide, config.slides.duration);
if (config.globalMode === 'play' && !config.bottombar.paused) advanceBottomBarTimeout = setTimeout(() => advanceSlide('bottombar'), config.bottombar.duration);

module.exports = { advance, previous, getRelativeQueue, togglePaused }