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
	io.to('kiosk').emit(`${slideSet}.set`, getRelativeQueue(-1, 1, slideSet));
	io.to('adminconsole').emit(`${slideSet}.set`, getRelativeQueue(0, 19, slideSet));
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

	const currentSlideKey = config.data[slideSet].queues.main.items[config.data[slideSet].queues.main.position];
	if (currentSlideKey.startsWith('queue.')) {
		const queueKey = currentSlideKey.slice(6);

		config.data[slideSet].queues[queueKey].position += 1;
		if (config.data[slideSet].queues[queueKey].position >= config.data[slideSet].queues[queueKey].items.length) config.data[slideSet].queues[queueKey].position = 0;
	}

	config.data[slideSet].queues.main.position += 1;
	if (config.data[slideSet].queues.main.position >= config.data[slideSet].queues.main.items.length) config.data[slideSet].queues.main.position = 0;

	if (slideSet === 'bottombar') currentAbsoluteBottomBarPosition += 1;
	else currentAbsoluteSlidePosition += 1;

	saveConfig();
	update(slideSet);

	if (config.data.globalMode === 'play' && !config.data[slideSet].paused) {
		const currentSlide = getRelativeQueue(0, 0, slideSet)[0];

		if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advance('bottombar'), currentSlide.duration);
		else advanceSlideTimeout = setTimeout(advance, currentSlide.duration);
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

	const lastSlide = getRelativeQueue(-1, -1, slideSet)[0];
	if (lastSlide.queue) {
		config.data[slideSet].queues[lastSlide.queue].position -= 1;
		if (config.data[slideSet].queues[lastSlide.queue].position < 0) config.data[slideSet].queues[lastSlide.queue].position = config.data[slideSet].queues[lastSlide.queue].items.length - 1;
	}

	config.data[slideSet].queues.main.position -= 1;
	if (config.data[slideSet].queues.main.position < 0) config.data[slideSet].queues.main.position = config.data[slideSet].queues.main.items.length - 1;

	if (slideSet === 'bottombar') currentAbsoluteBottomBarPosition -= 1;
	else currentAbsoluteSlidePosition -= 1;

	saveConfig();
	update(slideSet);

	if (config.data.globalMode === 'play' && !config.data[slideSet].paused) {
		const currentSlide = getRelativeQueue(0, 0, slideSet)[0];

		if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advance('bottombar'), currentSlide.duration);
		else advanceSlideTimeout = setTimeout(advance, currentSlide.duration);
	}
}

/**
 * Toggle if the slides are paused
 * @param {String} slideSet
 * @param {Boolean} toggle
 */
function togglePaused(slideSet = 'slides', toggle = true) {
	if (toggle) {
		config.data[slideSet].paused = !config.data[slideSet].paused;
		saveConfig();
	}

	if (config.data.globalMode !== 'play' || config.data[slideSet].paused) {
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
		const currentSlide = getRelativeQueue(0, 0, slideSet)[0];

		if (slideSet === 'bottombar') advanceBottomBarTimeout = setTimeout(() => advance('bottombar'), currentSlide.duration);
		else advanceSlideTimeout = setTimeout(advance, currentSlide.duration);

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
			const slideKey = getQueueRelativeKey(config.data[slideSet].queues.main, currentPosition);
			if (slideKey.startsWith('queue.')) {
				const queueKey = slideKey.slice(6);
				if (currentPosition === 0) currentQueue = queueKey;
				const subSlideKey = getQueueRelativeKey(config.data[slideSet].queues[queueKey], queuePositionModifiers[queueKey] || (currentPosition === 0 ? 0 : -1));
				const subSlide = config.data[slideSet].definitions[subSlideKey];

				slides.unshift({
					id: subSlideKey,
					duration: (subSlide.duration || config.data[slideSet].queues[queueKey].duration || config.data[slideSet].duration),
					durationType: subSlide.duration ? 'slide' : (config.data[slideSet].queues[queueKey].duration ? 'queue' : 'default'),
					queue: queueKey,
					position: currentAbsolutePosition + currentPosition,
					...subSlide,
				});
				queuePositionModifiers[queueKey] = (queuePositionModifiers[queueKey] || (currentPosition === 0 ? 0 : -1)) - 1;
			}
			else {
				const slide = config.data[slideSet].definitions[slideKey];

				slides.unshift({
					id: slideKey,
					duration: (slide.duration || config.data[slideSet].duration),
					durationType: slide.duration ? 'slide' : 'default',
					position: currentAbsolutePosition + currentPosition,
					...slide,
				});
			}

			currentPosition -= 1;
		}

		currentPosition = 1;
	}

	queuePositionModifiers = {};
	if (currentQueue) queuePositionModifiers[currentQueue] = 1;

	while (currentPosition <= end) {
		const slideKey = getQueueRelativeKey(config.data[slideSet].queues.main, currentPosition);
		if (slideKey.startsWith('queue.')) {
			const queueKey = slideKey.slice(6);
			const subSlideKey = getQueueRelativeKey(config.data[slideSet].queues[queueKey], queuePositionModifiers[queueKey] || 0);
			const subSlide = config.data[slideSet].definitions[subSlideKey];

			slides.push({
				id: subSlideKey,
				duration: (subSlide.duration || config.data[slideSet].queues[queueKey].duration || config.data[slideSet].duration),
				durationType: subSlide.duration ? 'slide' : (config.data[slideSet].queues[queueKey].duration ? 'queue' : 'default'),
				queue: queueKey,
				position: currentAbsolutePosition + currentPosition,
				...subSlide,
			});
			queuePositionModifiers[queueKey] = (queuePositionModifiers[queueKey] || 0) + 1;
		}
		else {
			const slide = config.data[slideSet].definitions[slideKey];
			slides.push({
				id: slideKey,
				duration: (slide.duration || config.data[slideSet].duration),
				durationType: slide.duration ? 'slide' : 'default',
				position: currentAbsolutePosition + currentPosition,
				...slide,
			});
		}

		currentPosition += 1;
	}

	return slides;
}

/**
 * Get the key of the slide from the queue and relative position
 * @param {Object} queue
 * @param {Number} relativePosition
 */
function getQueueRelativeKey(queue, relativePosition) {
	const queueLength = queue.items.length;
	let position = queue.position + relativePosition;

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
if (config.data.globalMode === 'play' && !config.data.slides.paused) advanceSlideTimeout = setTimeout(advance, config.data.slides.duration);
if (config.data.globalMode === 'play' && !config.data.bottombar.paused) advanceBottomBarTimeout = setTimeout(() => advance('bottombar'), config.data.bottombar.duration);

module.exports = { advance, previous, getRelativeQueue, togglePaused };