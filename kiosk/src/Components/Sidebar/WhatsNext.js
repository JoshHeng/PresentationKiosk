import { useEffect, useState } from 'react';

import styles from './WhatsNext.module.css';

export default function WhatsNext({ nextEvent, showCountdown, showSchedule }) {
	const [ secondsRemaining, setSecondsRemaining ] = useState(120);

	useEffect(() => {
		var timeUpdater = null;

		function updateTime() {
			const currentTime = nextEvent && Math.floor(nextEvent.startsAt - (new Date()).getTime()/1000);
			setSecondsRemaining((currentTime && currentTime > 0) ? currentTime : 0);
			timeUpdater = setTimeout(updateTime, 1000);
		}
		updateTime();

		return () => {
			if (timeUpdater) {
				clearTimeout(timeUpdater);
				timeUpdater = null;
			}
		}
	}, [nextEvent]);

	return (
		<div className={styles.whatsNext}>
			<h2 style={{ opacity: showSchedule ? '100%' : 0 }}>Up Next</h2>
			<span className={styles.timeRemaining} style={{ opacity: (showSchedule && showCountdown && secondsRemaining > 0) ? '100%' : 0 }}>{ secondsRemaining > 0 ? `${String(Math.floor(secondsRemaining/60)).padStart(2, '0')}:${String(Math.floor(secondsRemaining%60)).padStart(2, '0')}` : '00:00' }</span>
			<p className={styles.title} style={{ opacity: showSchedule ? '100%' : 0 }}>{ nextEvent ? nextEvent.title : 'None' }</p>
		</div>
	);
}