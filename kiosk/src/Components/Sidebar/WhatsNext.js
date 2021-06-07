import styles from './WhatsNext.module.css';

export default function WhatsNext() {
	return (
		<div className={styles.whatsNext}>
			<h2>Up Next</h2>
			<span className={styles.timeRemaining}>00:52</span>
			<p className={styles.title}>Welcome</p>
		</div>
	);
}