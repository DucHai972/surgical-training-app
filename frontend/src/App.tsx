import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FrappeProvider } from 'frappe-react-sdk';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionDetail from './pages/SessionDetail';
import AuthRoute from './components/AuthRoute';
import Guide from './pages/Guide';
import Analytics from './pages/Analytics';

function App() {
	const getToken = () => localStorage.getItem('token') || '';
	
	// Simple effect to ensure light theme
	useEffect(() => {
		// Remove dark class if present
		document.documentElement.classList.remove('dark');
		document.body.classList.remove('dark');
	}, []);
	
	return (
		<div className="light-theme-wrapper" style={{backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'system-ui, sans-serif'}}>
		<FrappeProvider 
				enableSocket={!import.meta.env.DEV}
			socketPort="9004"
			tokenParams={{
				useToken: true,
				type: 'Bearer',
				token: getToken
			}}
		>
			<Toaster position="top-right" />
				<Router basename={import.meta.env.DEV ? "/assets/surgical_training/frontend" : "/surgical_training"}>
				<Routes>
					<Route path="/login" element={<Login />} />
					<Route path="/dashboard" element={
						<AuthRoute>
							<Dashboard />
						</AuthRoute>
					} />
					<Route path="/session/:sessionName" element={
						<AuthRoute>
							<SessionDetail />
						</AuthRoute>
					} />
					<Route path="/guide" element={<Guide />} />
					<Route path="/analytics" element={<Analytics />} />
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
				</Routes>
			</Router>
		</FrappeProvider>
		</div>
	);
}

export default App;
