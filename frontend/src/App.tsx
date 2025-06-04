import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FrappeProvider } from 'frappe-react-sdk';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionDetail from './pages/SessionDetail';
import EvaluationForm from './pages/EvaluationForm';
import AuthRoute from './components/AuthRoute';

function App() {
	const getToken = () => localStorage.getItem('token') || '';
	
	// Effect to set light theme
	useEffect(() => {
		// Force light theme by removing 'dark' class
		document.documentElement.classList.remove('dark');
		
		// Apply light background color directly to body and html
		document.body.style.backgroundColor = '#f9fafb'; // Light gray (bg-gray-50)
		document.documentElement.style.backgroundColor = '#f9fafb';
		
		// Force light theme variables
		document.documentElement.style.setProperty('--background', 'oklch(1 0 0)');
		document.documentElement.style.setProperty('--foreground', 'oklch(0.145 0 0)');
		document.documentElement.style.setProperty('--card', 'oklch(1 0 0)');
		document.documentElement.style.setProperty('--card-foreground', 'oklch(0.145 0 0)');
	}, []);
	
	return (
		<FrappeProvider 
			socketPort="9004"
			tokenParams={{
				useToken: true,
				type: 'Bearer',
				token: getToken
			}}
		>
			<Toaster position="top-right" />
			<Router basename="/surgical_training">
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
					<Route path="/evaluate/:sessionName" element={
						<AuthRoute>
							<EvaluationForm />
						</AuthRoute>
					} />
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
				</Routes>
			</Router>
		</FrappeProvider>
	);
}

export default App;
