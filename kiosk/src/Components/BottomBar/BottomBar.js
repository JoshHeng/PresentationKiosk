import { useEffect, useState } from 'react';
import styles from './BottomBar.module.css';
import Social from './Social';
import socket from '../../socket';

function SlideContent({ slide }) {
	switch (slide.type) {
		case 'tweet':
		case 'instagrampost':
			return <Social socialData={slide} />;
		case 'text':
			return <div className={styles.contentBox}>{ slide.text }</div>
		default:
			return <></>;
	}
}

export default function BottomBar() {
	const [ activeSlides, setActiveSlides ] = useState([]);
	const [ cover, setCover ] = useState(false);

	useEffect(() => {
		socket.on('bottombar.set', slides => {
			setActiveSlides(slides);
		});
		socket.on('bottombar.cover', _val => setCover(_val));
		socket.emit('bottombar.request');

		return () => {
			socket.off('bottombar.set');
			socket.off('bottombar.cover');
		}
	}, []);

	return (
		<div className={styles.bottomBar}>
			{ activeSlides.map((slide, index) => (
				<div key={slide.position} style={{ opacity: index === 1 ? 1 : 0 }}>
					<SlideContent slide={slide} />
				</div>
			)) }
			<div className={styles.cover} style={{ opacity: cover === false ? 0 : 1}}>
				{ cover && <div className={styles.contentBox}>{cover}</div> }
			</div>
		</div>
	);
}