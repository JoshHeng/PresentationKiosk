import Slides from './Slides';
import Schedule from './Sidebar/Schedule';
import WhatsNext from './Sidebar/WhatsNext';
import BottomBar from './BottomBar/BottomBar';
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
