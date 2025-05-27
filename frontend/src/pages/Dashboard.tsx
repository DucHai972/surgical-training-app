import { useState, useEffect } from 'react';
import { useFrappeGetCall } from 'frappe-react-sdk';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';

interface Session {
  name: string;
  title: string;
  description: string;
  session_date: string;
  status: string;
}

const Dashboard = () => {
  const [sessions, setSessions] = useState<Session[]>([]);

  const { data, error, isValidating } = useFrappeGetCall('surgical_training.api.session.get_sessions');

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar with no top margin */}
      <Navbar currentPage="dashboard" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Training Sessions</h2>
          <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 cursor-pointer">
            <Plus size={16} />
            New Session
          </Button>
        </div>
        
        {isValidating && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}
        
        {!isValidating && sessions.length === 0 && (
          <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center p-10">
              <div className="h-20 w-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Calendar size={32} className="text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Active Sessions</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">
                No training sessions are currently available. Create a new session to get started.
              </p>
              <Button className="mt-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus size={16} />
                Create Session
              </Button>
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.name} className="bg-white dark:bg-gray-800 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 dark:text-white">{session.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Calendar size={14} />
                  {formatDate(session.session_date)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-gray-700 dark:text-gray-300 text-sm overflow-hidden" 
                  style={{ maxHeight: '100px' }}
                  dangerouslySetInnerHTML={{ __html: session.description || 'No description available' }}
                />
              </CardContent>
              <CardFooter>
                <Button 
                  asChild 
                  className="w-full bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  <Link to={`/session/${session.name}`}>
                    View Session
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 