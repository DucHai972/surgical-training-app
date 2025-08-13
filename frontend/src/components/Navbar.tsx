import { Link } from 'react-router-dom';
import { useFrappeAuth, useFrappeGetCall } from 'frappe-react-sdk';
import toast from 'react-hot-toast';
import { LogOut, Activity, BarChart3, BookOpen, Bell, User } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import backgroundImg from '../assets/background.jpg';

// Helper function to get the correct login URL based on environment
const getLoginUrl = () => {
  const isDev = import.meta.env.DEV;
  return isDev ? '/assets/surgical_training/frontend/login' : '/isim/login';
};

interface NavbarProps {
  currentPage?: string;
}

const Navbar = ({ currentPage = 'dashboard' }: NavbarProps) => {
  const { currentUser, logout } = useFrappeAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [hasNotifications] = useState(false); // Track if there are notifications - would be set by API call
  const notificationRef = useRef<HTMLDivElement>(null);

  // Get user's full name from User document
  const { data: userData } = useFrappeGetCall(
    'frappe.client.get',
    { 
      doctype: 'User',
      name: currentUser 
    },
    undefined,
    {
      isPaused: () => !currentUser
    }
  );

  // Debug user data to understand response structure
  React.useEffect(() => {
    if (userData) {
      console.log('👤 User data received:', userData);
    }
  }, [userData]);

  // Debug notification state changes
  React.useEffect(() => {
    console.log('🔔 showNotifications state changed to:', showNotifications, {
      timestamp: new Date().toISOString(),
      shouldShowDropdown: showNotifications
    });
  }, [showNotifications]);

  // Background images array - you can add more images here
  const backgroundImages = [
    backgroundImg,
    // Add more background images as needed
  ];

  // Change background every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      window.location.replace(getLoginUrl());
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      window.location.replace(getLoginUrl());
    }
  };

  const navItems = [
    { name: 'Guide', path: '/guide', icon: BookOpen, key: 'guide' },
    { name: 'Analytics', path: '/analytics', icon: BarChart3, key: 'analytics' },
  ];

  return (
    <header 
      className="relative border-b border-indigo-500/20 overflow-hidden"
      style={{
        backgroundImage: `url(${backgroundImages[currentBgIndex]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/90 to-violet-600/90"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo + Nav Items */}
          <div className="flex items-center gap-8">
            {/* Logo - Clickable */}
            <Link 
              to="/dashboard"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-transparent rounded-lg px-2 py-1"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <Activity size={20} className="text-white" />
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                Medical Training
              </span>
            </Link>

            {/* Navigation Pills */}
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.key;
                
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-xl
                      text-sm transition-all duration-150 ease-out
                      focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-indigo-600
                      ${isActive 
                        ? 'bg-white/16 text-white font-semibold' 
                        : 'text-white/90 hover:text-white hover:border hover:border-white/20'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side - User Cluster */}
          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={(e) => {
                  console.log('🔔 Notification button clicked!', {
                    event: e,
                    currentShowState: showNotifications,
                    willShowAfterClick: !showNotifications,
                    hasNotifications,
                    timestamp: new Date().toISOString()
                  });
                  
                  setShowNotifications(!showNotifications);
                  console.log('🔔 setShowNotifications called with:', !showNotifications);
                }}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-indigo-600"
                title="Notifications"
              >
                <Bell size={20} />
                {/* Notification dot - only show if there are notifications */}
                {hasNotifications && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-indigo-600"></div>
                )}
              </button>
            </div>

            {/* User Chip */}
            <Link
              to="/account"
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/16 rounded-lg transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-white/90 text-sm font-semibold hidden sm:block">
                {userData?.message?.full_name || userData?.full_name || currentUser || 'User'}
              </span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-300 hover:text-red-200 hover:bg-red-500/10 rounded-lg transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-indigo-600"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="text-sm font-semibold hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          {console.log('🔔 Rendering notification dropdown - showNotifications is true')}
          {/* Backdrop to close dropdown when clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={(e) => {
              console.log('🔔 Notification backdrop clicked - closing dropdown', e.target);
              // Check if click is outside notification area
              if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
                console.log('🔔 Click confirmed outside notification area - closing');
                setShowNotifications(false);
              } else {
                console.log('🔔 Click inside notification area - ignoring');
              }
            }}
          ></div>
          <div 
            className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200"
            style={{
              position: 'fixed',
              top: '70px', // Position just below navbar
              right: '16px', // 16px from right edge
              zIndex: 99999,
              backgroundColor: 'white',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              {hasNotifications ? (
                <div className="space-y-3">
                  {/* Future: Display actual notifications here */}
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">New training session assigned</p>
                      <p className="text-xs text-gray-500 mt-1">2 minutes ago</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-700 font-medium mb-1">No new notifications</p>
                  <p className="text-sm text-gray-500">We'll notify you when something arrives!</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Navbar; 