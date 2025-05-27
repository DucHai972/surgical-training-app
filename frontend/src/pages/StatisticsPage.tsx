import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { useFrappeAuth, useFrappeGetCall } from 'frappe-react-sdk';
import toast from 'react-hot-toast';

interface StatisticsData {
  total: number;
  sessions: Record<string, any>;
  averages: Record<string, number>;
  counts: Record<string, number>;
  score_distributions: Record<string, Record<string, number>>;
}

const scoreFields = [
  'identification',
  'situation',
  'history',
  'examination',
  'assessment',
  'recommendation',
  'grs',
];

const StatisticsPage: React.FC = () => {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useFrappeAuth();

  const { data: statsData, error: statsError, isLoading } = useFrappeGetCall<{
    message: string;
    data: StatisticsData;
  }>('surgical_training.api.evaluation.get_evaluation_statistics', {});

  useEffect(() => {
    if (statsData?.message === 'Success') {
      setData(statsData.data);
    } else if (statsError) {
      console.error('Error fetching statistics:', statsError);
      setError(statsError.message || 'Failed to load statistics');
      toast.error('Failed to load statistics. Please try again later.');
    }
  }, [statsData, statsError]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading statistics...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Statistics</h2>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Session Evaluation Statistics</h2>
        <span className="text-sm text-gray-500">Logged in as: {currentUser}</span>
      </div>

      <Card className="mb-8 p-4">
        <div className="text-lg font-semibold mb-4">Total Evaluations: {data.total}</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {scoreFields.map(field => (
            <div key={field} className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium capitalize text-gray-700">{field.replace('_', ' ')}:</div>
              <div className="mt-2">
                <div className="text-sm text-gray-600">Average: {data.averages[field]?.toFixed(2) ?? '-'}</div>
                <div className="text-sm text-gray-600">Count: {data.counts[field] ?? '-'}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mb-8 p-4">
        <h3 className="font-semibold mb-4">Score Distributions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scoreFields.map(field => (
            <div key={field} className="bg-gray-50 p-4 rounded-lg">
              <div className="font-medium capitalize mb-2">{field.replace('_', ' ')}</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.score_distributions[field] || {}).map(([score, count]) => (
                  <div key={score} className="bg-blue-100 text-blue-800 rounded px-3 py-1 text-sm">
                    Score {score}: {count}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-4">Evaluations per Session</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-4 py-2">Session</th>
                <th className="border px-4 py-2"># Evaluations</th>
                {scoreFields.map(field => (
                  <th key={field} className="border px-4 py-2">{field.replace('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.sessions).map(([session, stats]) => (
                <tr key={session} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">{session}</td>
                  <td className="border px-4 py-2">{stats.count}</td>
                  {scoreFields.map(field => (
                    <td key={field} className="border px-4 py-2">{stats[field]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StatisticsPage; 