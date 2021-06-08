import { Row, Col } from 'antd';
import styles from './App.module.css';

function App() {
	return (
		<main>
			<Row gutter={16}>
				<Col span={12}><p>Hi</p></Col>
				<Col span={12}><p>Hi</p></Col>
			</Row>
		</main>
	);
}

export default App;
