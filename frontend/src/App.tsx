import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FrappeProvider } from 'frappe-react-sdk';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SessionDetail from './pages/SessionDetail';
import UserAccount from './pages/UserAccount';
import RoleChecker from './pages/RoleChecker';
import AuthRoute from './components/AuthRoute';
import Guide from './pages/Guide';
import Analytics from './pages/Analytics';

function App() {
	// Simple effect to ensure light theme
	useEffect(() => {
		// Remove dark class if present
		document.documentElement.classList.remove('dark');
		document.body.classList.remove('dark');
		
		// Debug routing info
		console.log('🔗 Router Debug Info:', {
			pathname: window.location.pathname,
			isDev: import.meta.env.DEV,
			basename: import.meta.env.DEV ? "/assets/surgical_training/frontend" : "/isim",
			fullUrl: window.location.href
		});
	}, []);
	
	return (
		<div className="light-theme-wrapper" style={{backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'system-ui, sans-serif'}}>
		<FrappeProvider 
				url={import.meta.env.DEV ? undefined : `${window.location.origin}`}
				enableSocket={false}
		>
			<Toaster position="top-right" />
				<Router basename={import.meta.env.DEV ? "/assets/surgical_training/frontend" : "/isim"}>
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
					<Route path="/account" element={
						<AuthRoute>
							<UserAccount />
						</AuthRoute>
					} />
					<Route path="/guide" element={<Guide />} />
					<Route path="/analytics" element={
						<AuthRoute>
							<Analytics />
						</AuthRoute>
					} />
					<Route path="/role-checker" element={
						<AuthRoute>
							<RoleChecker />
						</AuthRoute>
					} />
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
					{/* Catch-all route for debugging */}
					<Route path="*" element={
						<div className="min-h-screen flex items-center justify-center bg-gray-50">
							<div className="text-center">
								<h1 className="text-2xl font-bold text-gray-900 mb-4">Route Not Found</h1>
								<p className="text-gray-600 mb-4">The requested route was not found.</p>
								<p className="text-sm text-gray-500">Current location: {window.location.pathname}</p>
								<p className="text-sm text-gray-500">Basename: {import.meta.env.DEV ? "/assets/surgical_training/frontend" : "/isim"}</p>
								<div className="mt-4">
									<a href="/isim/login" className="text-blue-600 hover:text-blue-800">Go to Login</a>
									{' | '}
									<a href="/isim/dashboard" className="text-blue-600 hover:text-blue-800">Go to Dashboard</a>
								</div>
							</div>
						</div>
					} />
				</Routes>
			</Router>
		</FrappeProvider>
		</div>
	);
}

export default App;
