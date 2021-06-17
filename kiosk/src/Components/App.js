import { useEffect, useState } from 'react';
import Slides from './Slides';
import Schedule from './Sidebar/Schedule';
import BottomBar from './BottomBar/BottomBar';
import Login from './Login';
import styles from './App.module.css';
import socket from '../socket';
import './musicplayer';

function App() {
	const [ loggedIn, setLoggedIn ] = useState(1);

	useEffect(() => {
		socket.on('connect', () => {
			if (localStorage.getItem('kioskpassword')) {
				setLoggedIn(1);
				socket.emit('login.kiosk', localStorage.getItem('kioskpassword'), success => {
					if (success) setLoggedIn(2);
					else {
						setLoggedIn(0);
						localStorage.removeItem('kioskpassword');
					}
				});
			}
			else setLoggedIn(0);
		});

		return () => socket.off('connect');
	}, []);

	function attemptLogin(password) {
		setLoggedIn(1);
		socket.emit('login.kiosk', password, success => {
			if (success) {
				setLoggedIn(2);
				localStorage.setItem('kioskpassword', password);
			}
			else {
				setLoggedIn(-1);
				localStorage.removeItem('kioskpassword');
			}
		});
	}

	if (!loggedIn || loggedIn < 2) return <Login attemptLogin={attemptLogin} loading={loggedIn === 1} invalidCredentials={loggedIn === -1} />;

	return (
		<div className={styles.kiosk}>
			<main>
				<Slides />
				<div className={styles.sidebar}>
					<div className={styles.logo}>
						<img src="/images/logo.png" alt="Logo" />
					</div>
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
