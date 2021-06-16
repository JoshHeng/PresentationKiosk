import { useEffect, useState } from 'react';
import styles from './BottomBar.module.css';
import Tweet from './Tweet';
import socket from '../../socket';

export default function BottomBar() {
	const [ activeSlides, setActiveSlides ] = useState([]);

	useEffect(() => {
		socket.on('bottombar.set', slides => {
			setActiveSlides(slides);
		});

		socket.emit('bottombar.request');

		return () => socket.off('bottombar.set');
	}, []);

	return (
		<div className={styles.bottomBar}>
			{ activeSlides.map((slide, index) => (
				<div key={slide.position} style={{ opacity: index === 1 ? 1 : 0 }}>
					{ slide.type === 'tweet' ? <Tweet tweetData={slide} /> : slide.description }
					
				</div>
			)) }
		</div>
	);
}