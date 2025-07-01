import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart3, Users, MessageSquare, Clock, Activity, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';

// Mock data - Replace with actual API calls
const mockAnalytics = {
  totalSessions: 156,
  totalParticipants: 48,
  totalComments: 324,
  averageSessionDuration: '45 min',
  sessionsThisMonth: 23,
  participationRate: '87%',
  recentActivity: [
    {
      type: 'comment',
      user: 'Dr. Smith',
      action: 'commented on',
      target: 'Basic Suturing Technique',
      time: '2 hours ago'
    },
    {
      type: 'session',
      user: 'Dr. Johnson',
      action: 'completed',
      target: 'Advanced Laparoscopy',
      time: '4 hours ago'
    },
    {
      type: 'comment',
      user: 'Dr. Williams',
      action: 'commented on',
      target: 'Surgical Knot Tying',
      time: '5 hours ago'
    }
  ],
  monthlyStats: [
    { month: 'Jan', sessions: 18, comments: 45 },
    { month: 'Feb', sessions: 22, comments: 52 },
    { month: 'Mar', sessions: 25, comments: 63 },
    // Add more months as needed
  ]
};

const Analytics = () => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  const stats = [
    {
      title: 'Total Sessions',
      value: mockAnalytics.totalSessions,
      description: 'All time training sessions',
      icon: Activity,
      trend: '+12% from last month',
      color: 'blue'
    },
    {
      title: 'Total Participants',
      value: mockAnalytics.totalParticipants,
      description: 'Active participants',
      icon: Users,
      trend: '+8% from last month',
      color: 'green'
    },
    {
      title: 'Total Comments',
      value: mockAnalytics.totalComments,
      description: 'Engagement through comments',
      icon: MessageSquare,
      trend: '+15% from last month',
      color: 'purple'
    },
    {
      title: 'Average Duration',
      value: mockAnalytics.averageSessionDuration,
      description: 'Per training session',
      icon: Clock,
      trend: '-5% from last month',
      color: 'orange'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="analytics" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics Dashboard
              </h2>
              <p className="text-gray-600">
                Track and analyze training performance metrics
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
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="group hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-${stat.color}-100`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                  </div>
                  <span className={`text-sm font-medium text-${
                    stat.trend.startsWith('+') ? 'green' : 'red'
                  }-600`}>
                    {stat.trend}
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {stat.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Session Statistics</CardTitle>
                  <CardDescription>Training session metrics over time</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Chart placeholder - Implement with your preferred charting library
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest updates and interactions</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalytics.recentActivity.map((activity, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'comment' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {activity.type === 'comment' ? (
                        <MessageSquare className={`w-4 h-4 ${
                          activity.type === 'comment' ? 'text-purple-600' : 'text-blue-600'
                        }`} />
                      ) : (
                        <Activity className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.user}</span>
                        {' '}{activity.action}{' '}
                        <span className="font-medium">{activity.target}</span>
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                className="w-full mt-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                View All Activity
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 