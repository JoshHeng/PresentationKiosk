import { useEffect, useState } from 'react';
import styles from './Slides.module.css';
import socket from '../socket';

export default function Slides() {
	const [ wheelRotation, setWheelRotation ] = useState(0);
	const [ activeSlides, setActiveSlides ] = useState([]);
	const [ cover, setCover ] = useState(false);

	useEffect(() => {
		socket.on('slides.set', slides => {
			setActiveSlides(slides);
			setWheelRotation(rotation => rotation += 90);
		});
		socket.on('slides.cover', _cover => setCover(_cover));

		socket.emit('slides.request');

		return () =>{
			socket.off('slides.set');
			socket.off('slides.cover');
		}
	}, []);

	return (
		<div className={styles.slides}>
			<img className={styles.wheel} src="%PUBLIC_URL%/images/wheel.png" alt="Wheel" style={{ transform: `rotate(${wheelRotation}deg)` }} />
			{ activeSlides.map((slide, index) => (
				<div className={styles.slide} key={slide.position} style={{ left: index < 1 ? 'calc(-100% - 2rem)' : ( index > 1 ? '100%' : '0')}}>
					<img src={slide.src} alt="Slide" />
				</div>
			)) }
			<div className={styles.cover} style={{ opacity: cover ? 1 : 0 }}>
				<img src="%PUBLIC_URL%/images/logo.png" alt="Logo" />
			</div>
		</div>
	);
}