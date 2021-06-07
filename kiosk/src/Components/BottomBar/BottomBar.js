import styles from './BottomBar.module.css';
import Tweet from './Tweet';

export default function BottomBar() {
	return (
		<div className={styles.bottomBar}>
			<Tweet />
		</div>
	);
}