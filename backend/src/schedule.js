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
		showCountdown: config.data.globalMode === 'play' && config.data.schedule.showCountdown,
		showSchedule: !config.data.schedule.hideSchedule,
		events: config.data.schedule.events.slice(config.data.schedule.currentEventIndex, config.data.schedule.currentEventIndex + maxEventsToShow),
	});
	io.to('adminconsole').emit('schedule.set', {
		...config.data.schedule,
		showSchedule: !config.data.schedule.hideSchedule,
	});
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
			if (isNaN(event.startsAt)) return { error: 'Invalid start time' };

			newEvents.push({
				startsAt: event.startsAt,
				title: event.title.slice(0, 256),
				time: event.time.slice(0, 32),
			});
		}

		return { events: newEvents };
	}
	catch (err) {
		console.error(err);
		return { error: 'Invalid' };
	}
}

module.exports = { update, validateEvents };