import { useState, useEffect } from 'react';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Calendar, Play, Clock, Users, ChevronRight, Trash2, MapPin, User, UserCheck, BookOpen, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

interface Session {
  name: string;
  title: string;
  description: string;
  session_date: string;
  status: string;
  time?: string;
  location?: string;
  facilitator?: string;
  assessor?: string;
  duration?: string;
  participants_count?: number;
  videos_count?: number;
}

const Dashboard = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  const { data, error, isValidating, mutate } = useFrappeGetCall('surgical_training.api.session.get_sessions');
  const { call: deleteSession } = useFrappePostCall('surgical_training.api.session.delete_session');

  useEffect(() => {
    // Check if data exists and has the expected format
    if (data && typeof data === 'object' && data.message) {
      // Handle the nested structure from Frappe API
      const responseData = data.message;
      
      // Make sure responseData has the expected format
      if (responseData && responseData.message === 'Success' && Array.isArray(responseData.data)) {
        // Add mock data for demo purposes - in production this would come from the API
        const enhancedSessions = responseData.data.map((session: Session, index: number) => ({
          ...session,
          time: index === 0 ? "09:00 AM" : "02:00 PM",
          location: index === 0 ? "Simulation Lab A" : "Simulation Lab B",
          facilitator: index === 0 ? "Dr. Sarah Johnson" : "Dr. Michael Chen",
          assessor: index === 0 ? "Dr. Emily Davis" : "Dr. Robert Wilson",
          duration: index === 0 ? "45 min" : "60 min",
          participants_count: index === 0 ? 6 : 8,
          videos_count: index === 0 ? 3 : 4
        }));
        setSessions(enhancedSessions);
      } else {
        console.error('Unexpected API response format:', responseData);
      }
    }
    
    if (error) {
      toast.error('Failed to load sessions');
      console.error('Error loading sessions:', error);
    }
  }, [data, error]);

  const handleDeleteSession = async (sessionName: string, sessionTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingSession(sessionName);
    
    try {
      const response = await deleteSession({ session_name: sessionName });
      
      if (response?.message === 'Success') {
        toast.success('Session deleted successfully');
        // Refresh the sessions list
        mutate();
      } else {
        toast.error(response?.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setDeletingSession(null);
    }
  };

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

  const stripHtmlTags = (html: string) => {
    if (!html) return 'No description available';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || 'No description available';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Navbar */}
      <Navbar currentPage="dashboard" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Training Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your surgical training sessions and track progress
              </p>
            </div>
            <Button className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-3 rounded-xl">
              <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
              <span className="font-medium">New Session</span>
              <ChevronRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>

        {/* Statistics Cards - Removed for now */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Statistics cards removed as requested */}
        </div>
        
        {/* Loading State */}
        {isValidating && (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent absolute top-0 left-0"></div>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {!isValidating && sessions.length === 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <div className="relative mb-6">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                  <Calendar size={40} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Plus size={16} className="text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Active Sessions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                No training sessions are currently available. Create your first session to begin the surgical training journey.
              </p>
              <Button className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl">
                <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
                <span className="font-medium">Create Your First Session</span>
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Sessions Grid */}
        {!isValidating && sessions.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Training Sessions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sessions.map((session, index) => (
                <Card 
                  key={session.name} 
                  className="group bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 leading-tight">
                        {session.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 ml-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(session.status)}`}>
                          {session.status || 'Active'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-colors duration-200 shrink-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteSession(session.name, session.title);
                          }}
                          disabled={deletingSession === session.name}
                        >
                          {deletingSession === session.name ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Date and Time Row */}
                    <CardDescription className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span className="text-sm font-medium">{formatDate(session.session_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span className="text-sm font-medium">{session.time || "TBD"}</span>
                      </div>
                    </CardDescription>

                    {/* Location and Duration */}
                    <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span className="text-sm">{session.location || "TBD"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle size={14} />
                        <span className="text-sm">{session.duration || "45 min"}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-4 pt-0">
                    {/* Description */}
                    <div className="mb-4">
                      <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-3 mb-3">
                        {stripHtmlTags(session.description)}
                      </div>
                    </div>

                    {/* Staff Information */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User size={14} className="text-blue-600" />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Facilitator:</span>
                        <span className="text-gray-800 dark:text-gray-200">{session.facilitator || "TBD"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserCheck size={14} className="text-green-600" />
                        <span className="text-gray-600 dark:text-gray-400 font-medium">Assessor:</span>
                        <span className="text-gray-800 dark:text-gray-200">{session.assessor || "TBD"}</span>
                      </div>
                    </div>
                    
                    {/* Session Statistics */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Users size={14} />
                        <span>{session.participants_count || 0} participants</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <BookOpen size={14} />
                        <span>{session.videos_count || 0} videos</span>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <Button 
                      asChild 
                      className="group w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 cursor-pointer shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 rounded-xl"
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
      </div>
    </div>
  );
};

export default Dashboard; 