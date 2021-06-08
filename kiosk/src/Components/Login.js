export default function Login() {
	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#efefef', height: '100vh' }}>
			<div style={{ width: '28rem', textAlign: 'center', backgroundColor: '#fff' }}>
				<img src="/images/logo-black.png" alt="Logo" style={{ maxHeight: '8rem', maxWidth: '25rem' }} />
				<h1 style={{ margin: 0, fontSize: '1.8em' }}>Kiosk Login</h1>

				<form name="login" style={{ marginTop: '1rem' }}>
					<div>
						<label for="password" style={{ fontSize: '0.8em', marginRight: '0.3rem' }}>Password</label>
						<input type="password" required style={{ padding: '0.2rem' }} />
					</div>

					<button type="submit" style={{ padding: '0.2rem 1rem', background: '#fff', border: '0.05rem solid #999', margin: '0.8rem', cursor: 'pointer' }}>Login</button>
				</form>
			</div>
		</div>
	)
}