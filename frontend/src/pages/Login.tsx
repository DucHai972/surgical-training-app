import { useState, useEffect } from 'react';
import { useFrappeAuth } from 'frappe-react-sdk';
import { useNavigate } from 'react-router-dom';
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

  const { login, currentUser } = useFrappeAuth();

  // Monitor authentication state changes and redirect when authenticated
  useEffect(() => {
    if (currentUser) {
      console.log('User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await login({ username, password });
      console.log('Login successful', response);
      toast.success('Login successful');
      
      // Force redirect with a small delay to ensure state update is processed
      setTimeout(() => {
        window.location.href = '/surgical_training/dashboard';
      }, 500);
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
        <Card className="w-full border-0 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img 
                src={logoUCC} 
                alt="UCC Logo" 
                className="h-20 w-auto drop-shadow-md" 
              />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Surgical Training Platform</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User size={16} className="text-indigo-500" />
                  Username
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                  className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Lock size={16} className="text-indigo-500" />
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Surgical Training Platform. All rights reserved.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
