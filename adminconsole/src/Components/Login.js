import { Card, Form, Input, Button, Alert } from 'antd';

export default function Login({ attemptLogin, loading, invalidCredentials }) {
	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#efefef', height: '100vh', paddingBottom: '10rem' }}>
			<Card style={{ width: '30rem', textAlign: 'center' }}>
				<img src="%PUBLIC_URL%/images/logo.png" alt="Logo" style={{ maxHeight: '8rem', maxWidth: '25rem' }} />
				<h1 style={{ margin: 0 }}>Admin Console Login</h1>

				{ loading ? <p>Loading...</p> :
					<Form name="login" onFinish={values => attemptLogin(values.password)} style={{ marginTop: '1rem' }} requiredMark={false}>
						{ invalidCredentials && <Alert message="Invalid password." type="error" style={{ marginBottom: '1rem' }} /> }
						<Form.Item label="Password" name="password" required rules={[{ required: true }]}>
							<Input.Password />
						</Form.Item>

						<Form.Item>
							<Button type="primary" htmlType="submit">Login</Button>
						</Form.Item>
					</Form>
				}

				
			</Card>
		</div>
	)
}