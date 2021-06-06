import Slides from './Slides';
import Schedule from './Schedule';
import WhatsNext from './WhatsNext';
import BottomBar from './BottomBar';
import styles from './App.module.css';

function App() {
	return (
		<div className={styles.kiosk}>
			<main>
				<Slides />
				<div class={styles.sidebar}>
					<div style={{ minHeight: '4rem' }}>
						LOGO
					</div>
					<WhatsNext />
					<Schedule />
				</div>
			</main>
			<footer>
				<BottomBar />
			</footer>
		</div>
	);
}

export default App;
