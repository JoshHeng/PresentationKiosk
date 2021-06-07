import styles from './Slides.module.css';

export default function Slides() {
	return (
		<div className={styles.slides}>
			<img className={styles.wheel} src="/images/wheel.png" alt="Wheel" />
			Slides
		</div>
	);
}