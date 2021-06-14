import { useEffect, useState } from 'react';
import Slides from './Slides';
import Schedule from './Sidebar/Schedule';
import WhatsNext from './Sidebar/WhatsNext';
import BottomBar from './BottomBar/BottomBar';
import Login from './Login';
import styles from './App.module.css';
import socket from '../socket';

function App() {
	const [ loggedIn, setLoggedIn ] = useState(0);

	useEffect(() => {
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
	}, []);

	function attemptLogin(password) {
		setLoggedIn(1);
		socket.emit('login.kiosk', password, success => {
			if (success) {
				setLoggedIn(2);
				localStorage.setItem('kioskpassword', password);
			}
			else {
				setLoggedIn(0);
				localStorage.removeItem('kioskpassword');
			}
		});
	}

	if (!loggedIn) return <Login attemptLogin />;
	if (loggedIn === 1) return <p>Loading</p>

	return (
		<div className={styles.kiosk}>
			<main>
				<Slides />
				<div class={styles.sidebar}>
					<div className={styles.logo}>
						<img src="/images/logo.png" alt="Logo" />
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
