import { Link, useNavigate } from 'react-router-dom';
import { useFrappeAuth } from 'frappe-react-sdk';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { LogOut, Activity, BarChart3, BookOpen, User } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavbarProps {
  currentPage?: string;
}

const Navbar = ({ currentPage = 'dashboard' }: NavbarProps) => {
  const navigate = useNavigate();
  const { logout, currentUser } = useFrappeAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Array of medical/surgical background images
  const backgroundImages = [
    'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?q=80&w=1932&auto=format&fit=crop', // Operating room
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=1932&auto=format&fit=crop', // Medical equipment
    'https://images.unsplash.com/photo-1584362917165-526a968579e8?q=80&w=1932&auto=format&fit=crop', // Modern surgical suite
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1932&auto=format&fit=crop', // Medical professionals
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?q=80&w=1932&auto=format&fit=crop', // Hospital corridor
  ];

  // Rotate background images every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % backgroundImages.length
      );
    }, 10000);

    return () => clearInterval(interval);
  }, [backgroundImages.length]);

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

  // Function to handle manual image change
  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Activity, key: 'dashboard' },
    { name: 'Guide', path: '/guide', icon: BookOpen, key: 'guide' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, key: 'analytics' },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background images with smooth transition */}
      {backgroundImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === currentImageIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/70 to-purple-900/80"></div>
        </div>
      ))}
      
      {/* Animated overlay pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:20px_20px] animate-pulse"></div>
      </div>
      
      {/* Header content */}
      <div className="relative py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Logo and title section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4 border border-white/30">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Learning Analytics Platform for Simulation-Based Training
            </h1>
            <p className="text-blue-100 text-lg font-medium">
              Advanced video training for medical professionals
            </p>
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-2">
                {backgroundImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageChange(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer hover:scale-125 ${
                      index === currentImageIndex 
                        ? 'bg-white scale-125 shadow-lg' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Switch to background image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            {/* Navigation items */}
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.key;
                
                return (
                  <Button
                    key={item.key}
                    variant="ghost"
                    className={`group relative px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                      isActive 
                        ? 'text-white bg-white/25 backdrop-blur-sm border border-white/40 shadow-lg' 
                        : 'text-white/90 hover:text-white hover:bg-white/15 backdrop-blur-sm border border-transparent hover:border-white/30'
                    }`}
                    asChild
                  >
                    <Link to={item.path} className="flex items-center gap-2">
                      <Icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
            
            {/* User section */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/30">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
                <span className="text-white font-medium hidden sm:block">
                  {currentUser || 'User'}
                </span>
              </div>
              
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer bg-red-500 hover:bg-red-600 backdrop-blur-sm border border-red-400/30 transition-all duration-300 transform hover:scale-105 px-4 py-2 rounded-xl"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar; 