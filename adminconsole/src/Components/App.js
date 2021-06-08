import { Row, Col, Card, Button, Slider, Collapse, Space, InputNumber, Tabs, Table } from 'antd';
import Slides from './Slides';
import styles from './App.module.css';

function App() {
	return (
		<main style={{ padding: '1rem' }}>
			<Row gutter={16}>
				<Col span={12}>
					<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
						<h1 style={{ margin: 0 }}>Admin Console - Presentation Kiosk</h1>
						<img src="/images/logo.png" alt="Logo" style={{ maxHeight: '3rem' }} />
					</div>

					<Card title="Schedule" bordered={false}>
						<div>
							<Button style={{ marginRight: '1rem' }}>Hide Time Remaining</Button>
							<Button style={{ marginRight: '0.2rem' }}>Previous Event</Button>
							<Button type="primary">Next Event</Button>
						</div>
						<Collapse style={{ marginTop: '1rem' }}>
							<Collapse.Panel header="Events" key="1">

							</Collapse.Panel>
						</Collapse>
					</Card>
					<Card title="Music" bordered={false}>
						<div style={{ marginBottom: '1rem', fontSize: '1.1em' }}>
							<strong>Now Playing: </strong>Song
						</div>
						<div>
							<Button type="primary" style={{ marginRight: '0.5rem' }}>Pause</Button>
							<Button>Skip</Button>
						</div>
						<div style={{ marginTop: '1rem' }}>
							<label>Volume</label>
							<Slider min={0} max={100} labe/>
						</div>
					</Card>
				</Col>
				<Col span={12}>
					<Tabs defaultActiveKey="slides">
						<Tabs.TabPane tab="Slides" key="slides">
							<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
								<Space>
									<Button>Previous Slide</Button>
									<Button type="primary">Next Slide</Button>
								</Space>
								<div>
									<label style={{ marginRight: '0.5rem' }}>Slide Duration (s)</label>
									<InputNumber />
								</div>
							</div>
							<Slides />
						</Tabs.TabPane>
						<Tabs.TabPane tab="Bottom Bar" key="bar">
							<div>
								<Space>
									<Button>Previous Item</Button>
									<Button type="primary">Next Item</Button>
								</Space>
							</div>
						</Tabs.TabPane>
					</Tabs>
				</Col>
			</Row>
		</main>
	);
}

export default App;
