import { useState, useEffect, useCallback } from 'react';
import { useFrappeGetCall, useFrappeAuth } from 'frappe-react-sdk';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Calendar, Play, Clock, Users, ChevronRight, BarChart3, Stethoscope, Activity, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import UserActivity from '../components/UserActivity';
import { isCurrentUserAdmin } from '../utils/api';
import { useUserRoles } from '../hooks/useUserRoles';

interface Session {
  name: string;
  title: string;
  description: string;
  session_date: string;
  status: string;
}

const Dashboard = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'history'>('dashboard');

  // Stable tab handler to prevent unnecessary re-renders
  const handleTabChange = useCallback((tab: 'dashboard' | 'sessions' | 'history') => {
    console.log('🔄 Tab change requested:', tab, 'Current tab:', activeTab);
    
    // Special logging for History tab
    if (tab === 'history') {
      console.log('📋 History tab clicked! Current state:', {
        requestedTab: tab,
        currentActiveTab: activeTab,
        timestamp: new Date().toISOString()
      });
    }
    
    setActiveTab(tab);
    
    // Log immediately after state change
    setTimeout(() => {
      console.log('⏱️ State after tab change:', {
        requestedTab: tab,
        currentActiveTab: activeTab,
        actuallyChanged: activeTab === tab
      });
    }, 0);
  }, [activeTab]);
  const { currentUser: authUser } = useFrappeAuth();
  const { hasDoctor, userRoles, rolesLoading, isReady } = useUserRoles();
  const isAdmin = isCurrentUserAdmin(authUser || undefined);

  // Debug logging for troubleshooting
  console.log('🔍 Dashboard Debug:', {
    currentUser: authUser,
    isAdmin,
    hasDoctor,
    userRoles,
    rolesLoading,
    isReady
  });

  // Use different API based on user role - allow Doctor role to see all sessions
  const shouldShowAllSessions = isAdmin || hasDoctor;
  const apiEndpoint = shouldShowAllSessions
    ? 'surgical_training.api.session.get_sessions'
    : 'surgical_training.api.session_assignment.get_user_assigned_sessions';
  
  console.log('🌐 Dashboard API:', {
    shouldShowAllSessions,
    apiEndpoint,
    reasoning: shouldShowAllSessions ? 'Admin or Doctor role detected' : 'Regular user - showing assigned sessions only'
  });

  const { data, error, isValidating, mutate: refreshSessions } = useFrappeGetCall(apiEndpoint);

  useEffect(() => {
    // Check if data exists and has the expected format
    if (data && typeof data === 'object' && data.message) {
      // Handle the nested structure from Frappe API
      const responseData = data.message;
      
      // Make sure responseData has the expected format
      if (responseData && responseData.message === 'Success' && Array.isArray(responseData.data)) {
        setSessions(responseData.data);
      } else {
        console.error('Unexpected API response format:', responseData);
      }
    }
    
    if (error) {
      toast.error('Failed to load sessions');
      console.error('Error loading sessions:', error);
    }
  }, [data, error]);

  // Debug tab changes
  useEffect(() => {
    console.log('🎯 Active tab changed to:', activeTab, {
      timestamp: new Date().toISOString(),
      isHistory: activeTab === 'history',
      isDashboard: activeTab === 'dashboard',
      isSessions: activeTab === 'sessions'
    });
    
    // Special check for History tab content rendering
    if (activeTab === 'history') {
      console.log('📊 History tab is now active - UserActivity should render');
    }
  }, [activeTab]);

  // Handle sessions refresh
  const handleRefreshSessions = useCallback(async () => {
    try {
      await refreshSessions();
      toast.success('Sessions refreshed successfully');
    } catch (error) {
      console.error('Error refreshing sessions:', error);
      toast.error('Failed to refresh sessions');
    }
  }, [refreshSessions]);


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar currentPage="dashboard" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {activeTab === 'dashboard' && 'Training Dashboard'}
                {activeTab === 'sessions' && 'My Sessions'}
                {activeTab === 'history' && 'Activity History'}
              </h2>
              <p className="text-gray-600">
                {activeTab === 'dashboard' && 'Overview of your training sessions and progress statistics'}
                {activeTab === 'sessions' && 'View and manage your assigned training sessions'}
                {activeTab === 'history' && 'Track your learning activities and progress over time'}
              </p>
            </div>
            {activeTab === 'dashboard' && (
              <Button 
                onClick={handleRefreshSessions}
                disabled={isValidating}
                className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw size={18} className={`transition-transform duration-300 ${isValidating ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                <span className="font-medium">{isValidating ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            )}
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 size={16} />
              Dashboard
            </button>
            {hasDoctor && (
              <button
                onClick={() => handleTabChange('sessions')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sessions'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Stethoscope size={16} />
                My Sessions
              </button>
            )}
            <button
              onClick={() => handleTabChange('history')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity size={16} />
              History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <>
            {/* Statistics Cards - Removed for now */}
            
            {/* Loading State */}
            {isValidating && (
              <div className="flex justify-center items-center h-64">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
              </div>
            )}
            
            {/* Empty State */}
            {!isValidating && sessions.length === 0 && (
              <Card className="bg-white border border-gray-200 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <div className="relative mb-6">
                    <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
                      <Calendar size={40} className="text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Plus size={16} className="text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    No Active Sessions
                  </h3>
                  <p className="text-gray-600 text-center max-w-md mb-6">
                    No training sessions are currently available. Create your first session to begin the surgical training journey.
                  </p>
                  <Button className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl">
                    <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                    <span className="font-medium">Create Your First Session</span>
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Sessions Grid */}
            {!isValidating && sessions.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6 mt-4">
                  Training Sessions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map((session, index) => (
                    <Card 
                      key={session.name} 
                      className="group bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                      
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                                              <CardTitle className="text-xl text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                            {session.title}
                          </CardTitle>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                            {session.status || 'Active'}
                          </span>
                        </div>
                        <CardDescription className="flex items-center gap-2 text-gray-600">
                          <Calendar size={14} />
                          <span>{formatDate(session.session_date)}</span>
                          <Clock size={14} className="ml-2" />
                          <span>45 min</span>
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="pb-4">
                        <div 
                          className="text-gray-700 text-sm line-clamp-3 leading-relaxed" 
                          dangerouslySetInnerHTML={{ __html: session.description || 'No description available' }}
                        />
                        
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Users size={14} />
                            <span>No. participants</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Play size={14} />
                            <span>No. videos</span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="pt-0">
                        <Button 
                          asChild 
                          className="group w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl"
                        >
                          <Link to={`/session/${session.name}`} className="flex items-center justify-center gap-2">
                            <Play size={16} className="transition-transform duration-300 group-hover:scale-110" />
                            <span className="font-medium">Start Session</span>
                            <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* My Sessions Tab */}
        {activeTab === 'sessions' && hasDoctor && (
          <div className="max-w-full">
            {/* Render DoctorSessions content without the navbar wrapper */}
            <div className="min-h-[400px] bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-center py-12">
                <Stethoscope size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">My Sessions</h3>
                <p className="text-gray-600 mb-4">
                  Your assigned training sessions will appear here.
                </p>
                <p className="text-sm text-gray-500">
                  This feature is being integrated from the My Sessions page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activity History Tab */}
        {activeTab === 'history' && (
          <div className="max-w-full">
            <UserActivity />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 