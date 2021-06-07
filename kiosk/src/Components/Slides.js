import { useEffect, useState } from 'react';
import styles from './Slides.module.css';

const slides = ['https://www.havenresorts.com/uploads/9/8/7/9/98799368/published/16-9placeholder_59.png', 'https://www.clevertech-group.com/assets/img/placeholder/16x9.jpg'];

export default function Slides() {
	const [ wheelRotation, setWheelRotation ] = useState(0);
	const [ currentSlideIndex, setCurrentSlideIndex ] = useState(0);
	const [ activeSlides, setActiveSlides ] = useState([]);

	useEffect(() => {
		let _slides = [];
		_slides.push({
			id: 1,
			src: slides[0]
		});
		_slides.push({
			id: 2,
			src: slides[1]
		});
		_slides.push({
			id: 3,
			src: slides[0]
		});
		_slides.push({
			id: 4,
			src: slides[1]
		});
		_slides.push({
			id: 5,
			src: slides[0]
		});
		_slides.push({
			id: 6,
			src: slides[1]
		});
		_slides.push({
			id: 7,
			src: slides[0]
		});
		setActiveSlides(_slides);
	}, []);

	useEffect(() => {
		const rotator = setInterval(() => {
			setWheelRotation(rotation => rotation += 90);

			setActiveSlides(existingSlides => {
				let slides = existingSlides.slice(1);
				slides.push(existingSlides[0]);
				return slides;
			});
		}, 2000);

		return () => clearInterval(rotator);
	}, []);

	console.log(activeSlides);

	return (
		<div className={styles.slides}>
			<img className={styles.wheel} src="/images/wheel.png" alt="Wheel" style={{ transform: `rotate(${wheelRotation}deg)` }} />
			{ activeSlides.map((slide, index) => (
				<div className={styles.slide} key={slide.id} style={{ left: index < 1 ? 'calc(-100% - 2rem)' : ( index > 1 ? '100%' : '0')}}>
					<img src={slide.src} alt="Slide" />
				</div>
			)) }
		</div>
	);
}