import { useState, useEffect } from 'react';
import styles from './Schedule.module.css';
import WhatsNext from './WhatsNext';
import socket from '../../socket';

export default function Schedule() {
	const [ events, setEvents ] = useState([]);
	const [ showCountdown, setShowCountdown ] = useState(false);

	useEffect(() => {
		socket.on('schedule.set', data => {
			console.log('hey');
			console.log(data);
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
				<h2>Schedule (BST)</h2>
				{ events.length === 0 ? 'None' : 
					<div>
						{ events.map(event => <div className={styles.event}>
							<strong>{ event.time }</strong> - { event.title }
						</div>)}
					</div>
				}
			</div>
		</>
	);
}