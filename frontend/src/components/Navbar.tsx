import { Link, useNavigate } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

interface NavbarProps {
  currentPage?: string;
}

const Navbar = ({ currentPage = 'dashboard' }: NavbarProps) => {
  const navigate = useNavigate();
  const { logout, currentUser } = useFrappeAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="relative">
      {/* Background image overlay with dark gradient for better text visibility */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?q=80&w=1932&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/70 via-indigo-900/60 to-indigo-800/70"></div>
      </div>
      
      {/* Header content */}
      <div className="relative py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Surgical Training Platform</h1>
            <p className="text-blue-100">Advanced video training for medical professionals</p>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Button
                variant="ghost"
                className={`${currentPage === 'dashboard' ? 'text-white bg-white/10 border border-white/20' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                asChild
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Resources
              </Button>
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                Analytics
              </Button>
              <Button
                variant="ghost"
                className={`${currentPage === 'statistics' ? 'text-white bg-white/10 border border-white/20' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                asChild
              >
                <Link to="/statistics">Statistics</Link>
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-white bg-indigo-700/50 px-3 py-1 rounded-full text-sm border border-indigo-500/30">
                Welcome, {currentUser}
              </span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar; 