import { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Slider, Tabs, message, Radio } from 'antd';
import SlidesPreview from './SlidesPreview';
import Login from './Login';
import Schedule from './Schedule'
import socket from '../socket';

function App() {
	const [ loggedIn, setLoggedIn ] = useState(1);
	const [ globalMode, setGlobalMode ] = useState('play');
	const [ localVolume, setLocalVolume ] = useState(5);
	const [ musicStatus, setMusicStatus ] = useState({ volume: 5, paused: false });

	useEffect(() => {
		socket.on('connect', () => {
			if (localStorage.getItem('adminconsolepassword')) {
				setLoggedIn(1);
				socket.emit('login.adminconsole', localStorage.getItem('adminconsolepassword'), success => {
					if (success) {
						setLoggedIn(2);
						message.success('Connected to Server');
					}
					else {
						setLoggedIn(0);
						localStorage.removeItem('adminconsolepassword');
					}
				});
			}
			else setLoggedIn(0);
		});

		socket.on('kiosk.connected', () => {
			message.success('Kiosk connected to Server');
		});
		socket.on('kiosk.disconnected', () => {
			message.error('Kiosk disconnected from Server');
		});
		socket.on('adminconsole.connected', () => {
			message.success('Admin Console connected to Server');
		});
		socket.on('adminconsole.disconnected', () => {
			message.error('Admin Console disconnected from Server');
		});
		
		socket.on('music.volume', volume => setMusicStatus(_status => {
			let status = Object.assign({}, _status);
			status.volume = volume;
			setLocalVolume(volume);
			return status;
		}));
		socket.on('music.pause', volume => setMusicStatus(_status => {
			let status = Object.assign({}, _status);
			status.paused = true;
			return status;
		}));
		socket.on('music.resume', volume => setMusicStatus(_status => {
			let status = Object.assign({}, _status);
			status.paused = false;
			return status;
		}));

		socket.on('globalmode.change', mode => setGlobalMode(mode));
		socket.emit('globalmode.request');

		return () => {
			socket.off('connect');
			socket.off('kiosk.connected');
			socket.off('kiosk.disconnected');
			socket.off('adminconsole.connected');
			socket.off('adminconsole.disconnected');
			socket.off('music.volume');
			socket.off('music.pause');
			socket.off('music.resume');
			socket.off('globalmode.change');
		}
	}, []);

	useEffect(() => {
		if (loggedIn === 2) {
			socket.on('disconnect', () => {
				if (loggedIn === 2) message.error('Disconnected from Server');
			});
		}
		
		return () => socket.off('disconnect');
	}, [loggedIn])

	function attemptLogin(password) {
		setLoggedIn(1);
		socket.emit('login.adminconsole', password, success => {
			if (success) {
				setLoggedIn(2);
				message.success('Connected to Server');
				localStorage.setItem('adminconsolepassword', password);
			}
			else {
				setLoggedIn(-1);
				message.error('Invalid password');
				localStorage.removeItem('adminconsolepassword');
			}
		});
	}

	if (!loggedIn || loggedIn < 2) return <Login attemptLogin={attemptLogin} loading={loggedIn === 1} invalidCredentials={loggedIn === -1} />;

	return (
		<main style={{ padding: '1rem' }}>
			<Row gutter={16}>
				<Col span={12}>
					<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
						<h1 style={{ margin: 0 }}>Admin Console - Presentation Kiosk</h1>
						<img src="/images/logo.png" alt="Logo" style={{ maxHeight: '3rem' }} />
					</div>

					<Card title="Global Mode" bordered={false}>
						<Radio.Group value={globalMode} onChange={event => socket.emit('globalmode.set', event.target.value)}>
							<Radio.Button value="play">Play</Radio.Button>
							<Radio.Button value="pause">Pause</Radio.Button>
							<Radio.Button value="blank">Blank</Radio.Button>
						</Radio.Group>
					</Card>

					<Card title="Music" bordered={false}>
						<div>
							<Button type="primary" style={{ marginRight: '0.5rem' }} onClick={() => socket.emit('music.toggle')} disabled={globalMode !== 'play'}>{ musicStatus.paused ? 'Resume' : 'Pause' }</Button>
							<Button onClick={() => socket.emit('music.skip')} disabled={globalMode !== 'play'}>Skip</Button>
						</div>
						<div style={{ marginTop: '1rem' }}>
							<label>Volume</label>
							<Slider min={0} max={100} onAfterChange={() => socket.emit('music.volume.set', localVolume)} value={localVolume} onChange={val => setLocalVolume(val)} disabled={globalMode !== 'play'} />
						</div>
					</Card>

					<Schedule disabled={globalMode !== 'play'} />
					
				</Col>
				<Col span={12}>
					<Tabs defaultActiveKey="slides">
						<Tabs.TabPane tab="Slides" key="slides" forceRender>
							<SlidesPreview disabled={globalMode !== 'play'} />
						</Tabs.TabPane>
						<Tabs.TabPane tab="Bottom Bar" key="bar" forceRender>
							<SlidesPreview type="bottombar" disabled={globalMode !== 'play'} />
						</Tabs.TabPane>
					</Tabs>
				</Col>
			</Row>
		</main>
	);
}

export default App;
