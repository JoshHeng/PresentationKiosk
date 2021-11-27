import { useState, useEffect } from 'react';
import styles from './Schedule.module.css';
import WhatsNext from './WhatsNext';
import socket from '../../socket';

export default function Schedule() {
	const [ events, setEvents ] = useState([]);
	const [ showCountdown, setShowCountdown ] = useState(false);

	useEffect(() => {
		socket.on('schedule.set', data => {
			setShowCountdown(data.showCountdown);
			setEvents(data.events);
		});
		socket.emit('schedule.request');

		return () => {
			socket.off('schedule.set');
		}
	}, []);

	return (
		<>
			<WhatsNext nextEvent={events.length > 0 && events[0]} showCountdown={showCountdown} />
			<div className={styles.schedule}>
				<h2>Schedule (GMT)</h2>
				{ events.length === 0 ? 'None' : 
					<div>
						{ events.map(event => <div className={styles.event} key={event.id}>
							<strong>{ event.time }</strong><br />{ event.title }
						</div>)}
					</div>
				}
			</div>
		</>
	);
}