import { useState } from 'react';
import { useFrappeGetCall, useFrappePostCall } from 'frappe-react-sdk';
import { useNavigate } from 'react-router-dom';
import { getDisplayRoles } from '../utils/roleUtils';
import { useUserRoles } from '../hooks/useUserRoles';
import {
  Clock,
  CheckCircle,
  PlayCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  User,
  Filter,
  History,
  TrendingUp,
  Video,
  ArrowLeft,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

interface SessionAssignment {
  name: string;
  session: string;
  session_title: string;
  session_description: string;
  session_date: string;
  doctor_status: string;
  started_at?: string;
  completed_at?: string;
  progress_notes?: string;
  total_comments: number;
  video_count: number;
  assignment_date: string;
}

interface DashboardStats {
  session_counts: {
    not_started: number;
    in_progress: number;
    completed: number;
  };
  total_comments: number;
  recent_comments: number;
  completed_this_month: number;
  total_assigned: number;
}

interface HistoryItem extends SessionAssignment {
  comments: Array<{
    name: string;
    video_title: string;
    timestamp: number;
    comment_text: string;
    comment_type: string;
    created_at: string;
  }>;
}

const DoctorSessions = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSession, setSelectedSession] = useState<SessionAssignment | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Use the reusable role hook
  const { 
    userRoles, 
    hasDoctor: hasPhysicianRole, 
    currentUser, 
    isReady: rolesReady 
  } = useUserRoles();
  
  const { data: dashboardStats, mutate: refreshStats } = useFrappeGetCall<DashboardStats>(
    'surgical_training.api.doctor_session.get_doctor_dashboard_stats',
    undefined,
    undefined,
    { isPaused: () => !hasPhysicianRole }
  );

  const { data: sessionsData, mutate: refreshSessions } = useFrappeGetCall(
    'surgical_training.api.doctor_session.get_doctor_sessions',
    { status_filter: statusFilter },
    undefined,
    { isPaused: () => !hasPhysicianRole }
  );

  const { data: historyData, mutate: refreshHistory } = useFrappeGetCall(
    'surgical_training.api.doctor_session.get_session_history',
    undefined,
    undefined,
    { isPaused: () => !hasPhysicianRole }
  );

  const { call: updateStatus } = useFrappePostCall('surgical_training.api.doctor_session.update_session_status');

  // The useUserRoles hook handles all the role loading logic

  const sessions = sessionsData?.sessions || [];
  const history = historyData?.history || [];
  const stats = dashboardStats || {
    session_counts: { not_started: 0, in_progress: 0, completed: 0 },
    total_comments: 0,
    recent_comments: 0,
    completed_this_month: 0,
    total_assigned: 0
  };

  // Status update handler
  const handleStatusUpdate = async (assignmentId: string, newStatus: string, notes?: string) => {
    setIsUpdatingStatus(true);
    try {
      await updateStatus({
        assignment_id: assignmentId,
        status: newStatus,
        progress_notes: notes
      });

      toast.success(`Status updated to ${newStatus}`);
      
      // Refresh data
      await Promise.all([refreshSessions(), refreshStats(), refreshHistory()]);
      
      setSelectedSession(null);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Not Started':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><Clock size={12} className="mr-1" />{status}</Badge>;
      case 'In Progress':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><PlayCircle size={12} className="mr-1" />{status}</Badge>;
      case 'Completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1" />{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show role access error if user doesn't have Physician role (only after roles are loaded)
  if (rolesReady && !hasPhysicianRole) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="my-sessions" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-6">
              <ShieldAlert className="h-12 w-12 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Access Restricted
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              You don't have the required permissions to access the My Sessions page.
            </p>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 text-left max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Your Current Access
              </h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">User:</span>
                  <span className="text-sm text-gray-900 ml-2">{currentUser}</span>
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
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Doctor
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To access this page, you need the <strong>Physician</strong> or <strong>Doctor</strong> role. 
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

  // Show loading state while fetching roles or if currentUser is not available
  if (!currentUser || !rolesReady) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="my-sessions" />
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-gray-600 text-center">
            <p className="font-medium mb-2">Loading Your Sessions</p>
            <p className="text-sm">Checking permissions and loading data...</p>
            {currentUser && (
              <p className="text-xs text-gray-500 mt-2">User: {currentUser}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="my-sessions" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Training Sessions</h1>
          <p className="text-gray-600 mt-2">Track your assigned sessions, update status, and view your training history</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'sessions', label: 'My Sessions', icon: Video },
            { id: 'history', label: 'History', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Assigned</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_assigned}</div>
                  <p className="text-xs text-muted-foreground">Training sessions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <PlayCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.session_counts.in_progress}</div>
                  <p className="text-xs text-muted-foreground">Active sessions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.session_counts.completed}</div>
                  <p className="text-xs text-muted-foreground">This month: {stats.completed_this_month}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.total_comments}</div>
                  <p className="text-xs text-muted-foreground">Recent: {stats.recent_comments}</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Overview</CardTitle>
                <CardDescription>Your current training status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Clock className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-700">{stats.session_counts.not_started}</div>
                    <div className="text-sm text-gray-500">Not Started</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <PlayCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-700">{stats.session_counts.in_progress}</div>
                    <div className="text-sm text-blue-500">In Progress</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-700">{stats.session_counts.completed}</div>
                    <div className="text-sm text-green-500">Completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Filter size={16} className="text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="All">All Sessions</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Sessions List */}
            <div className="grid gap-6">
              {sessions.map((session: SessionAssignment) => (
                <Card key={session.name} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-3">
                          {session.session_title}
                          {getStatusBadge(session.doctor_status)}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {session.session_description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={16} />
                        Session Date: {formatDate(session.session_date)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Video size={16} />
                        Videos: {session.video_count}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageSquare size={16} />
                        Comments: {session.total_comments}
                      </div>
                    </div>

                    {session.started_at && (
                      <div className="text-sm text-gray-600 mb-2">
                        Started: {formatDate(session.started_at)}
                      </div>
                    )}

                    {session.completed_at && (
                      <div className="text-sm text-gray-600 mb-2">
                        Completed: {formatDate(session.completed_at)}
                      </div>
                    )}

                    {session.progress_notes && (
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-1">Progress Notes:</div>
                        <div className="text-sm text-gray-600">{session.progress_notes}</div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSession(session)}
                      >
                        Update Status
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/isim/session/${session.session}`}
                      >
                        View Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {sessions.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
                    <p className="text-gray-600">
                      {statusFilter === 'All' 
                        ? 'You have no assigned sessions yet.'
                        : `No sessions with status "${statusFilter}".`
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Training History</CardTitle>
                <CardDescription>
                  Completed sessions and your contributions
                  {historyData?.summary && (
                    <span className="block mt-2 text-sm">
                      {historyData.summary.total_completed_sessions} completed sessions • 
                      {historyData.summary.total_comments} total comments • 
                      {historyData.summary.average_comments_per_session} avg comments per session
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid gap-6">
              {history.map((item: HistoryItem) => (
                <Card key={item.name}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      {item.session_title}
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" />
                        Completed
                      </Badge>
                    </CardTitle>
                    <CardDescription>{item.session_description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-sm">
                        <strong>Completed:</strong> {formatDate(item.completed_at!)}
                      </div>
                      <div className="text-sm">
                        <strong>Duration:</strong> {
                          item.started_at && item.completed_at
                            ? `${Math.round((new Date(item.completed_at).getTime() - new Date(item.started_at).getTime()) / (1000 * 60 * 60 * 24))} days`
                            : 'N/A'
                        }
                      </div>
                      <div className="text-sm">
                        <strong>Comments:</strong> {item.total_comments}
                      </div>
                    </div>

                    {item.progress_notes && (
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <div className="text-sm font-medium text-gray-700 mb-1">Final Notes:</div>
                        <div className="text-sm text-gray-600">{item.progress_notes}</div>
                      </div>
                    )}

                    {item.comments && item.comments.length > 0 && (
                      <div className="border-t pt-4">
                        <div className="text-sm font-medium text-gray-700 mb-3">
                          Your Comments ({item.comments.length})
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {item.comments.slice(0, 5).map((comment) => (
                            <div key={comment.name} className="bg-gray-50 p-2 rounded text-sm">
                              <div className="font-medium text-gray-700">
                                {comment.video_title} @ {Math.floor(comment.timestamp / 60)}:{(comment.timestamp % 60).toString().padStart(2, '0')}
                              </div>
                              <div className="text-gray-600 mt-1">{comment.comment_text}</div>
                            </div>
                          ))}
                          {item.comments.length > 5 && (
                            <div className="text-xs text-gray-500 text-center">
                              ... and {item.comments.length - 5} more comments
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {history.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed sessions</h3>
                    <p className="text-gray-600">
                      Complete some training sessions to see your history here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {selectedSession && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Update Session Status</CardTitle>
                <CardDescription>{selectedSession.session_title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Current Status</label>
                    <div className="mt-1">{getStatusBadge(selectedSession.doctor_status)}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['Not Started', 'In Progress', 'Completed'].map((status) => (
                      <Button
                        key={status}
                        variant={selectedSession.doctor_status === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleStatusUpdate(selectedSession.name, status)}
                        disabled={isUpdatingStatus}
                        className="text-xs"
                      >
                        {status}
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSession(null)}
                      disabled={isUpdatingStatus}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorSessions;