import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { getDisplayRoles } from '../utils/roleUtils';
import { useUserRoles } from '../hooks/useUserRoles';
import { Button } from '../components/ui/button';
import { BarChart3, Users, MessageSquare, Clock, Activity, ChevronRight, User, TrendingUp, Eye, FileText, AlertCircle, CheckCircle, UserPlus, Settings, X, ArrowLeft, ShieldAlert } from 'lucide-react';
import Navbar from '../components/Navbar';

interface Session {
  name: string;
  title: string;
  description: string;
  session_date: string;
  status: string;
}

interface Comment {
  name: string;
  doctor: string;
  doctor_name?: string;
  video_title: string;
  timestamp: number;
  comment_text: string;
  created_at: string;
}

interface SessionWithComments extends Session {
  comments: Comment[];
  commentCount: number;
  uniqueUsers: number;
  avgCommentsPerVideo: number;
  lastActivity: string;
}

interface User {
  name: string;
  email: string;
  full_name: string;
  enabled: number;
}

interface SessionAssignment {
  name: string;
  session: string;
  assigned_user: string;
  assigned_by: string;
  assignment_date: string;
}

const Analytics = () => {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionsWithComments, setSessionsWithComments] = useState<SessionWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<SessionAssignment[]>([]);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  // Use the reusable role hook
  const { 
    userRoles, 
    rolesError, 
    hasAdmin, 
    currentUser: authUser, 
    isReady: rolesReady 
  } = useUserRoles();
  
  // Fallback: Use hardcoded admin check if API fails
  const fallbackAdminCheck = authUser === 'administrator@gmail.com' || authUser === 'Administrator';

  // Fetch sessions data - always call this hook
  const { data: sessionsData } = useFrappeGetCall(
    'surgical_training.api.session.get_sessions'
  );

  // API calls for session assignments - always call these hooks
  const { call: bulkAssignSessions } = useFrappePostCall(
    'surgical_training.api.session_assignment.bulk_assign_sessions'
  );

  const { call: removeAssignment } = useFrappePostCall(
    'surgical_training.api.session_assignment.remove_session_assignment'
  );

  // Use hasAdmin from the hook, with fallback
  const hasAdministratorAccess = hasAdmin || fallbackAdminCheck;
  
  // Fetch users and assignments - moved to top to avoid hooks order violations
  useEffect(() => {
    const fetchUsersAndAssignments = async () => {
      if (!hasAdministratorAccess) return;
      
      try {
        // Fetch all users
        const usersResponse = await fetch('/api/method/surgical_training.api.session_assignment.get_all_users', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const usersResult = await usersResponse.json();
        if (usersResult && usersResult.message && usersResult.message.message === 'Success') {
          setUsers(usersResult.message.data);
        }

        // Fetch assignments
        const assignmentsResponse = await fetch('/api/method/surgical_training.api.session_assignment.get_session_assignments', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const assignmentsResult = await assignmentsResponse.json();
        if (assignmentsResult && assignmentsResult.message && assignmentsResult.message.message === 'Success') {
          setAssignments(assignmentsResult.message.data);
        }
      } catch (error) {
        console.error('Error fetching users and assignments:', error);
      }
    };

    fetchUsersAndAssignments();
  }, [hasAdministratorAccess]);

  // Fetch individual session details and comments - moved to top
  useEffect(() => {
    const fetchSessionsWithComments = async () => {
      if (!sessionsData || !sessionsData.message || sessionsData.message.message !== 'Success') {
        return;
      }

      const sessions = sessionsData.message.data;
      const sessionsWithCommentsData: SessionWithComments[] = [];

      for (const session of sessions) {
        try {
          const response = await fetch(
            `/api/method/surgical_training.api.session.get_session_details?session_name=${encodeURIComponent(session.name)}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );
          
          const result = await response.json();
          
          if (result && result.message && result.message.message === 'Success') {
            const sessionData = result.message.data;
            const comments = sessionData.comments || [];
            
            // Calculate analytics
            const uniqueUsers = new Set(comments.map((c: Comment) => c.doctor)).size;
            const videos = sessionData.videos || [];
            const avgCommentsPerVideo = videos.length > 0 ? comments.length / videos.length : 0;
            const lastActivity = comments.length > 0 
              ? new Date(Math.max(...comments.map((c: Comment) => new Date(c.created_at).getTime()))).toISOString()
              : session.session_date;

            sessionsWithCommentsData.push({
              ...session,
              comments,
              commentCount: comments.length,
              uniqueUsers,
              avgCommentsPerVideo,
              lastActivity
            });
          }
        } catch (error) {
          console.error(`Error fetching data for session ${session.name}:`, error);
          // Add session with empty comments if fetch fails
          sessionsWithCommentsData.push({
            ...session,
            comments: [],
            commentCount: 0,
            uniqueUsers: 0,
            avgCommentsPerVideo: 0,
            lastActivity: session.session_date
          });
        }
      }

      setSessionsWithComments(sessionsWithCommentsData);
      setLoading(false);
    };

    if (sessionsData && hasAdministratorAccess) {
      fetchSessionsWithComments();
    }
  }, [sessionsData, hasAdministratorAccess]);

  // Debug: log current user and role status
  console.log('Analytics Debug:', { 
    authUser, 
    userRoles, 
    rolesError: rolesError?.message,
    fallbackAdminCheck,
    hasAdministratorAccess,
    hasAdmin,
    rolesReady
  });
  
  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="analytics" />
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h3>
            <p className="text-gray-600">You need to log in to access analytics.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show role access error if user doesn't have administrator access
  if (rolesReady && !hasAdministratorAccess) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="analytics" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Access Restricted
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              You don't have the required permissions to access the Analytics dashboard.
            </p>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Your Current Access
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">User:</span>
                  <span className="text-sm text-gray-900 ml-2">{authUser}</span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Current Roles:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {userRoles.length > 0 ? (
                      getDisplayRoles(userRoles).map((role, index) => (
                        <span
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${role.color}`}
                        >
                          {role.name}
                        </span>
                      ))
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Guest
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-red-700">Required Role:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Admin
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To access this page, you need one of the administrator roles listed above. 
                Please contact your administrator to request the appropriate permissions.
              </p>
              
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while fetching roles
  if (!rolesReady) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="analytics" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Assignment handlers
  const handleAssignSessions = async () => {
    if (!selectedUser || selectedSessions.length === 0) return;
    
    setAssignmentLoading(true);
    try {
      const response = await bulkAssignSessions({
        user_email: selectedUser,
        session_names: JSON.stringify(selectedSessions)
      });
      
      if (response && response.message && response.message.message === 'Success') {
        const data = response.message.data;
        if (data.total_assigned > 0) {
          alert(`Successfully assigned ${data.total_assigned} sessions to user`);
        }
        if (data.errors && data.errors.length > 0) {
          console.warn('Assignment errors:', data.errors);
        }
        
        // Refresh assignments
        const assignmentsResponse = await fetch('/api/method/surgical_training.api.session_assignment.get_session_assignments', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const assignmentsResult = await assignmentsResponse.json();
        if (assignmentsResult && assignmentsResult.message && assignmentsResult.message.message === 'Success') {
          setAssignments(assignmentsResult.message.data);
        }
        
        // Reset form
        setSelectedUser('');
        setSelectedSessions([]);
        setShowAssignmentModal(false);
      }
    } catch (error) {
      console.error('Error assigning sessions:', error);
      alert('Failed to assign sessions');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentName: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return;
    
    try {
      const response = await removeAssignment({ assignment_name: assignmentName });
      if (response && response.message && response.message.message === 'Success') {
        // Refresh assignments
        const assignmentsResponse = await fetch('/api/method/surgical_training.api.session_assignment.get_session_assignments', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        const assignmentsResult = await assignmentsResponse.json();
        if (assignmentsResult && assignmentsResult.message && assignmentsResult.message.message === 'Success') {
          setAssignments(assignmentsResult.message.data);
        }
        alert('Assignment removed successfully');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const toggleSessionSelection = (sessionName: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionName)
        ? prev.filter(s => s !== sessionName)
        : [...prev, sessionName]
    );
  };


  // Calculate overall statistics
  const totalComments = sessionsWithComments.reduce((sum, session) => sum + session.commentCount, 0);
  const totalSessions = sessionsWithComments.length;
  const activeSessions = sessionsWithComments.filter(s => s.commentCount > 0).length;
  const allUsers = new Set(sessionsWithComments.flatMap(s => s.comments.map(c => c.doctor))).size;

  // Get recent activity
  const recentComments = sessionsWithComments
    .flatMap(session => session.comments.map(comment => ({ ...comment, sessionTitle: session.title })))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getEngagementLevel = (commentCount: number): { level: string; color: string; icon: any } => {
    if (commentCount === 0) return { level: 'No Activity', color: 'gray', icon: AlertCircle };
    if (commentCount < 5) return { level: 'Low', color: 'yellow', icon: Clock };
    if (commentCount < 15) return { level: 'Medium', color: 'blue', icon: Activity };
    return { level: 'High', color: 'green', icon: TrendingUp };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="analytics" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="analytics" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Comment Analytics Dashboard
              </h2>
              <p className="text-gray-600">
                Track user engagement and comment activity across training sessions
              </p>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'year'] as const).map((period) => (
                <Button
                  key={period}
                  variant={timeframe === period ? 'default' : 'outline'}
                  onClick={() => setTimeframe(period)}
                  className={`capitalize ${
                    timeframe === period 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600'
                  }`}
                >
                  {period}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {totalSessions} Total
                </span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                {activeSessions}
              </CardTitle>
              <CardDescription className="text-gray-600">
                Active Sessions with Comments
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-purple-100">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-600">
                  Engagement
                </span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                {totalComments}
              </CardTitle>
              <CardDescription className="text-gray-600">
                Total Comments Made
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-green-100">
                  <Users className="w-6 h-6 text-green-600" />
                  </div>
                <span className="text-sm font-medium text-green-600">
                  Contributors
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                {allUsers}
              </CardTitle>
              <CardDescription className="text-gray-600">
                Active Commenting Users
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300 transform hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-orange-100">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-orange-600">
                  Average
                </span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                {totalSessions > 0 ? (totalComments / totalSessions).toFixed(1) : '0'}
                </CardTitle>
                <CardDescription className="text-gray-600">
                Comments per Session
                </CardDescription>
              </CardContent>
            </Card>
        </div>

        {/* Session Assignment Management */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <Settings className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>Session Assignment Management</CardTitle>
                    <CardDescription>Assign training sessions to specific users</CardDescription>
                  </div>
                </div>
                <Button
                  onClick={() => setShowAssignmentModal(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                >
                  <UserPlus size={16} />
                  Assign Sessions
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600 border-b border-gray-200 pb-2">
                  <span className="font-medium">Current Assignments ({assignments.length})</span>
                  <span>Users: {new Set(assignments.map(a => a.assigned_user)).size}</span>
                </div>
                
                {assignments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserPlus size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No session assignments yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
                    {assignments.map((assignment) => {
                      const user = users.find(u => u.name === assignment.assigned_user);
                      const session = sessionsWithComments.find(s => s.name === assignment.session);
                      
                      return (
                        <div key={assignment.name} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {session?.title || assignment.session}
                              </p>
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <User size={10} />
                                {user?.full_name || assignment.assigned_user}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleRemoveAssignment(assignment.name)}
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X size={12} />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Assigned {new Date(assignment.assignment_date).toLocaleDateString()}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sessions List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                    <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <CardTitle>Session Comment Analytics</CardTitle>
                    <CardDescription>Engagement metrics by training session</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {sessionsWithComments.map((session, _) => {
                  const engagement = getEngagementLevel(session.commentCount);
                  const EngagementIcon = engagement.icon;
                  
                  return (
                    <div
                      key={session.name}
                      className="group p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedSession(selectedSession === session.name ? null : session.name)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium bg-${engagement.color}-100 text-${engagement.color}-700 flex items-center gap-1`}>
                              <EngagementIcon size={12} />
                              {engagement.level}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <MessageSquare size={14} className="text-purple-500" />
                              <span>{session.commentCount} comments</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users size={14} className="text-green-500" />
                              <span>{session.uniqueUsers} users</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <BarChart3 size={14} className="text-blue-500" />
                              <span>{session.avgCommentsPerVideo.toFixed(1)} avg/video</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Clock size={14} className="text-orange-500" />
                              <span>{formatDate(session.lastActivity)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          <Link
                            to={`/session/${session.name}`}
                            className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            title="View Session"
                          >
                            <Eye size={16} />
                          </Link>
                          <ChevronRight 
                            size={16} 
                            className={`text-gray-400 transition-transform duration-200 ${
                              selectedSession === session.name ? 'rotate-90' : ''
                            }`} 
                          />
                        </div>
                      </div>

                      {/* Expanded Session Details */}
                      {selectedSession === session.name && (
                        <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in-up">
                          <h4 className="font-medium text-gray-900 mb-3">Recent Comments:</h4>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {session.comments.slice(0, 5).map((comment) => (
                              <div key={comment.name} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                                      <User size={12} className="text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {comment.doctor_name || comment.doctor}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Clock size={10} />
                                    {formatTime(comment.timestamp)} in {comment.video_title}
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 line-clamp-2">
                                  {comment.comment_text}
                                </p>
                                <div className="mt-1 text-xs text-gray-500">
                                  {formatDate(comment.created_at)}
                                </div>
                              </div>
                            ))}
                            {session.comments.length > 5 && (
                              <div className="text-center">
                                <Link
                                  to={`/session/${session.name}`}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  View all {session.comments.length} comments →
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {sessionsWithComments.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Activity size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-lg font-medium">No Sessions Found</p>
                    <p className="text-sm">Create some training sessions to see analytics here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Sidebar */}
          <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest comment activity</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {recentComments.map((comment, _) => (
                  <div 
                    key={comment.name}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <User size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {comment.doctor_name || comment.doctor}
                        </span>
                        <span className="text-xs text-gray-500">commented</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-1">
                        {comment.comment_text}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{comment.sessionTitle}</span>
                        <span>•</span>
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {recentComments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Session Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-200 animate-fade-in-up max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                    <UserPlus size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Assign Sessions to User</h3>
                    <p className="text-sm text-gray-600">Select a user and choose which sessions to assign</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setShowAssignmentModal(false);
                    setSelectedUser('');
                    setSelectedSessions([]);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
                >
                  <X size={20} />
                </Button>
              </div>
              
              <div className="space-y-6">
                {/* User Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Choose a user...</option>
                    {users.map((user) => (
                      <option key={user.name} value={user.name}>
                        {user.full_name || user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Session Selection */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Sessions ({selectedSessions.length} selected)
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setSelectedSessions(sessionsWithComments.map(s => s.name))}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        onClick={() => setSelectedSessions([])}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {sessionsWithComments.map((session) => {
                      const isSelected = selectedSessions.includes(session.name);
                      const isAlreadyAssigned = selectedUser && assignments.some(
                        a => a.session === session.name && a.assigned_user === selectedUser
                      );
                      
                      return (
                        <div
                          key={session.name}
                          onClick={() => !isAlreadyAssigned && toggleSessionSelection(session.name)}
                          className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            isAlreadyAssigned
                              ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-25'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {session.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                <MessageSquare size={10} />
                                <span>{session.commentCount} comments</span>
                                <span>•</span>
                                <Clock size={10} />
                                <span>{new Date(session.session_date).toLocaleDateString()}</span>
                              </div>
                              {isAlreadyAssigned && (
                                <p className="text-xs text-orange-600 mt-1">Already assigned to this user</p>
                              )}
                            </div>
                            <div className="ml-2 flex items-center">
                              {isSelected && !isAlreadyAssigned && (
                                <CheckCircle size={16} className="text-indigo-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assignment Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {selectedUser && selectedSessions.length > 0 && (
                      <span>
                        Ready to assign {selectedSessions.length} session{selectedSessions.length !== 1 ? 's' : ''} to {
                          users.find(u => u.name === selectedUser)?.full_name || selectedUser
                        }
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => {
                        setShowAssignmentModal(false);
                        setSelectedUser('');
                        setSelectedSessions([]);
                      }}
                      variant="outline"
                      className="border-gray-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAssignSessions}
                      disabled={!selectedUser || selectedSessions.length === 0 || assignmentLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {assignmentLoading ? 'Assigning...' : 'Assign Sessions'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics; 