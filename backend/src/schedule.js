/**
 * Handles the schedule
 * 
 */
const { io } = require('./server');
const { config } = require('./config');

const maxEventsToShow = 5;

 /**
  * Update the schedule
  */
function update() {
	io.to('kiosk').emit('schedule.set', {
		showCountdown: config.globalMode === 'play' && config.schedule.showCountdown,
		events: config.schedule.events.slice(config.schedule.currentEventIndex, config.schedule.currentEventIndex + maxEventsToShow)
	});
	io.to('adminconsole').emit('schedule.set', config.schedule);
}

/**
 * Validate events
 * @param {Object[]} events 
 * @returns {Object} Result
 */
function validateEvents(events) {
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

module.exports = { update, validateEvents };