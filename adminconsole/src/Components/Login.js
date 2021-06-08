import { Card, Form, Input, Button } from 'antd';

export default function Login() {
	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#efefef', height: '100vh', paddingBottom: '10rem' }}>
			<Card style={{ width: '30rem', textAlign: 'center' }}>
				<img src="/images/logo.png" alt="Logo" style={{ maxHeight: '8rem', maxWidth: '25rem' }} />
				<h1 style={{ margin: 0 }}>Admin Console Login</h1>

				<Form name="login" onFinish={() => {}} style={{ marginTop: '3rem' }} requiredMark={false} >
					<Form.Item label="Password" name="password" required rules={[{ required: true }]}>
						<Input.Password />
					</Form.Item>

					<Form.Item>
						<Button type="primary" htmlType="submit">Login</Button>
					</Form.Item>
				</Form>
			</Card>
		</div>
	)
}