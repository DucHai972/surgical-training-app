import { useState, useEffect, useRef } from 'react';
import { useFrappeAuth } from 'frappe-react-sdk';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { LogIn, Lock, User } from 'lucide-react';
import logoUCC from '../assets/logo_UCC.png';
import backgroundImage from '../assets/background.jpg';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);
  const [preventAutoRedirect, setPreventAutoRedirect] = useState(false);

  const { login, currentUser, isValidating } = useFrappeAuth();

  // Check for logout flag and prevent auto-redirects temporarily
  useEffect(() => {
    const justLoggedOut = sessionStorage.getItem('just_logged_out') === 'true';
    if (justLoggedOut) {
      setPreventAutoRedirect(true);
      sessionStorage.removeItem('just_logged_out');
    }
  }, []);

  // Monitor authentication state changes and redirect when authenticated
  useEffect(() => {
    
    // Reset redirect flag when no user (i.e., after logout)
    if (!currentUser && !isValidating) {
      hasRedirected.current = false;
    }
    
    // DISABLE AUTO-REDIRECT COMPLETELY - only redirect after successful manual login
    // if (currentUser && !isValidating && location.pathname === '/login' && !hasRedirected.current && !preventAutoRedirect) {
    //   console.log('User authenticated via useEffect, redirecting to dashboard:', currentUser);
    //   hasRedirected.current = true;
    //   const dashboardPath = '/dashboard';
    //   // Use setTimeout to ensure state has settled
    //   setTimeout(() => {
    //     navigate(dashboardPath, { replace: true });
    //   }, 100);
    // }
  }, [currentUser, isValidating, navigate, location.pathname, preventAutoRedirect]);

  // Show loading if authentication is being validated
  if (isValidating) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoggingIn(true);
    try {
      await login({ username, password });
      toast.success('Login successful');
      
      // Wait for auth state to propagate before redirecting
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        
        // Wait longer for the frappe-react-sdk to update all components
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000); // Increased delay to ensure state propagation
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        toast.error(error.message || 'Login failed. Please check your credentials.');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0" 
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 py-10">
        <Card className="w-full border-0 shadow-2xl bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img 
                src={logoUCC} 
                alt="UCC Logo" 
                className="h-20 w-auto drop-shadow-md" 
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Learning Analytics Platform for Simulation-Based Training</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User size={16} className="text-indigo-500" />
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                  className="border-gray-300 bg-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock size={16} className="text-indigo-500" />
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="border-gray-300 bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-indigo-600 hover:bg-indigo-700 mt-4 h-11 cursor-pointer"
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 rounded-full border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 justify-center">
                    <LogIn size={18} />
                    <span>Sign in</span>
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-xs text-gray-500">
              © {new Date().getFullYear()} Learning Analytics Platform for Simulation-Based Training. All rights reserved.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
