import React, { useState, useEffect } from 'react';
import { useFrappeGetCall, useFrappeAuth } from 'frappe-react-sdk';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  MessageSquare, 
  BookOpen, 
  User, 
  Clock, 
  TrendingUp,
  Activity,
  Calendar,
  MoreHorizontal,
  RefreshCw,
  ChevronDown
} from 'lucide-react';

interface ActivityItem {
  type: 'comment' | 'session_assignment' | 'evaluation' | 'login';
  title: string;
  description: string;
  timestamp: string;
  formatted_time: string;
  relative_time: string;
  session?: string;
  details: any;
}

interface ActivityStats {
  total_comments: number;
  total_sessions: number;
  total_evaluations: number;
  last_activity: string;
}

interface ActivityResponse {
  status: string;
  activities: ActivityItem[];
  stats: ActivityStats;
  user: string;
  message?: ActivityResponse;
}

const UserActivity = () => {
  const [filter, setFilter] = useState<string>('all');
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulLoad, setLastSuccessfulLoad] = useState<Date | null>(null);
  const { currentUser } = useFrappeAuth();
  const { data: activityData, error: activityError, mutate: refreshActivity, isLoading } = useFrappeGetCall<ActivityResponse>(
    'surgical_training.api.user_activity.get_user_activity_history',
    {}, // No limit - get all activities
    undefined,
    {
      isPaused: () => !currentUser, // Only call API when user is authenticated
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 0, // Disable automatic refresh
      dedupingInterval: 5000, // Prevent duplicate requests within 5 seconds
    }
  );

  // Track component lifecycle (for debugging)
  useEffect(() => {
    console.log('🎬 UserActivity: Component mounted');
    return () => {
      console.log('🎬 UserActivity: Component unmounting');
    };
  }, []);

  // Removed: Force refresh when currentUser becomes available
  // This was causing excessive re-renders and tab state resets

  // Handle both direct response and message-wrapped response
  const responseData = activityData?.message || activityData;
  const activities = responseData?.activities || [];
  
  // Track successful loads and detect empty responses
  useEffect(() => {
    if (activityData && !activityError && !isLoading) {
      const hasValidData = activities.length > 0 || (responseData?.stats && Object.keys(responseData.stats).length > 0);
      if (hasValidData) {
        setLastSuccessfulLoad(new Date());
        setRetryCount(0);
        console.log('✅ UserActivity: Successful data load at', new Date().toISOString());
      } else {
        console.warn('⚠️ UserActivity: Empty response received', {
          activityData,
          responseData,
          activitiesLength: activities.length,
          stats: responseData?.stats
        });
      }
    }
  }, [activityData, activityError, isLoading, activities.length, responseData?.stats]);

  // Enhanced debug logging with load tracking
  console.log('🔍 Frontend UserActivity Debug:', {
    activityData,
    responseData,
    activitiesCount: activities.length,
    activitiesByType: {
      comments: activities.filter((a: ActivityItem) => a.type === 'comment').length,
      sessions: activities.filter((a: ActivityItem) => a.type === 'session_assignment').length,
      logins: activities.filter((a: ActivityItem) => a.type === 'login').length
    },
    sampleActivities: activities.slice(0, 3),
    stats: responseData?.stats,
    currentUser,
    isLoading,
    error: activityError,
    retryCount,
    lastSuccessfulLoad,
    filteredActivitiesCount: activities.filter((activity: ActivityItem) => {
      if (filter === 'all') return true;
      return activity.type === filter;
    }).length,
    currentFilter: filter,
    timestamp: new Date().toISOString()
  });
  
  const stats = responseData?.stats || {
    total_comments: 0,
    total_sessions: 0,
    total_evaluations: 0,
    last_activity: null
  };

  // Auto-retry mechanism for empty responses
  useEffect(() => {
    const shouldRetry = !isLoading && 
                      !activityError && 
                      activities.length === 0 && 
                      stats.total_comments === 0 && 
                      stats.total_sessions === 0 && 
                      retryCount < 3 &&
                      currentUser;

    if (shouldRetry) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff, max 5s
      console.log(`🔄 UserActivity: Auto-retry ${retryCount + 1}/3 in ${retryDelay}ms due to empty response`);
      
      const timeoutId = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        refreshActivity();
      }, retryDelay);

      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, activityError, activities.length, stats.total_comments, stats.total_sessions, retryCount, currentUser, refreshActivity]);


  // Extract unique sessions from activities
  const uniqueSessions = React.useMemo(() => {
    const sessions = new Set<string>();
    activities.forEach((activity: ActivityItem) => {
      if (activity.session) {
        sessions.add(activity.session);
      }
    });
    return Array.from(sessions).sort();
  }, [activities]);

  // Filter activities based on selected filters
  const filteredActivities = activities.filter((activity: ActivityItem) => {
    // First filter by activity type
    if (filter !== 'all' && activity.type !== filter) return false;
    
    // Then filter by session
    if (sessionFilter !== 'all' && activity.session !== sessionFilter) return false;
    
    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare size={16} className="text-blue-500" />;
      case 'session_assignment':
        return <BookOpen size={16} className="text-green-500" />;
      case 'login':
        return <User size={16} className="text-gray-500" />;
      default:
        return <Activity size={16} className="text-gray-400" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'comment':
        return 'bg-blue-50 border-blue-200';
      case 'session_assignment':
        return 'bg-green-50 border-green-200';
      case 'login':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'comment':
        return 'Comment';
      case 'session_assignment':
        return 'Session';
      case 'login':
        return 'Login';
      default:
        return 'Activity';
    }
  };

  if (activityError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity size={20} />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Failed to load activity history</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                console.log('🔄 UserActivity: Try Again button clicked');
                refreshActivity();
              }}
              className="mt-4"
            >
              <RefreshCw size={14} className="mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp size={16} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{(stats.total_comments || 0) + (stats.total_sessions || 0)}</p>
                <p className="text-sm text-gray-600">Total Activities</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total_comments || 0}</p>
                <p className="text-sm text-gray-600">Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BookOpen size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total_sessions || 0}</p>
                <p className="text-sm text-gray-600">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity size={20} />
                Activity History
              </CardTitle>
              <CardDescription>
                Your recent comments, sessions, and activities
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  refreshActivity();
                }}
                disabled={isLoading}
              >
                <RefreshCw size={14} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filter Controls */}
          <div className="mb-6 border-b border-gray-200 pb-4">
            {/* Activity Type Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: 'all', label: 'All', icon: Activity },
                { key: 'comment', label: 'Comments', icon: MessageSquare },
                { key: 'session_assignment', label: 'Sessions', icon: BookOpen },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {key === 'all' ? activities.length : activities.filter((a: ActivityItem) => a.type === key).length}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Session Filter Dropdown */}
            {uniqueSessions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Filter by Session:</span>
                <div className="relative">
                  <button
                    onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen size={14} />
                    {sessionFilter === 'all' ? 'All Sessions' : sessionFilter}
                    <ChevronDown size={14} className={`transition-transform ${showSessionDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showSessionDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowSessionDropdown(false)}
                      ></div>
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        <button
                          onClick={() => {
                            setSessionFilter('all');
                            setShowSessionDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            sessionFilter === 'all' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                          }`}
                        >
                          All Sessions ({activities.length} activities)
                        </button>
                        {uniqueSessions.map((session) => {
                          const sessionActivityCount = activities.filter((a: ActivityItem) => a.session === session).length;
                          return (
                            <button
                              key={session}
                              onClick={() => {
                                setSessionFilter(session);
                                setShowSessionDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                                sessionFilter === session ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                              }`}
                            >
                              {session} ({sessionActivityCount} activities)
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Activity size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "Start participating in sessions and leaving comments to see your activity history"
                  : `No ${getTypeLabel(filter).toLowerCase()} activities found`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity: ActivityItem, index: number) => (
                <div 
                  key={index}
                  className={`flex items-start gap-4 p-4 border rounded-lg transition-colors hover:shadow-sm ${getActivityColor(activity.type)}`}
                >
                  <div className="flex-shrink-0 p-2 bg-white rounded-lg border">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {activity.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(activity.type)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {activity.relative_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {activity.formatted_time}
                      </span>
                      {activity.session && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={12} />
                          Session: {activity.session}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserActivity;