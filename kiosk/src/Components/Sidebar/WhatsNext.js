import { useEffect, useState } from 'react';

import styles from './WhatsNext.module.css';

export default function WhatsNext() {
	const [ secondsRemaining, setSecondsRemaining ] = useState(120);

	useEffect(() => {
		function updateTime() {
			setSecondsRemaining(seconds => seconds > 0 ? seconds - 1 : 0);
			setTimeout(updateTime, 1000);
		}
		updateTime();
	}, []);
	console.log(secondsRemaining);

	return (
		<div className={styles.whatsNext}>
			<h2>Up Next</h2>
			<span className={styles.timeRemaining} style={{ opacity: secondsRemaining > 0 ? '100%' : 0 }}>{ secondsRemaining > 0 ? `${String(Math.floor(secondsRemaining/60)).padStart(2, '0')}:${String(Math.floor(secondsRemaining%60)).padStart(2, '0')}` : '00:00' }</span>
			<p className={styles.title}>Welcome</p>
		</div>
	);
}