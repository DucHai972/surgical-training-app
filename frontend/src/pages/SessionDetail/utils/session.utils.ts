/**
 * Session-related utility functions for SessionDetail
 */

export const getColorClasses = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    blue: 'text-blue-700 border-blue-200 hover:bg-blue-50',
    green: 'text-green-700 border-green-200 hover:bg-green-50',
    yellow: 'text-yellow-700 border-yellow-200 hover:bg-yellow-50',
    red: 'text-red-700 border-red-200 hover:bg-red-50',
    purple: 'text-purple-700 border-purple-200 hover:bg-purple-50',
    indigo: 'text-indigo-700 border-indigo-200 hover:bg-indigo-50',
    pink: 'text-pink-700 border-pink-200 hover:bg-pink-50',
    gray: 'text-gray-700 border-gray-200 hover:bg-gray-50'
  };
  return colorMap[color] || colorMap.blue;
};

export const getEvaluationLabel = (category: string, value: string): string => {
  const labels: { [key: string]: { [key: string]: string } } = {
    identification: {
      '0': 'Not demonstrated',
      '1': 'Basic identification',
      '2': 'Good identification',  
      '3': 'Excellent identification'
    },
    situation: {
      '0': 'Not demonstrated',
      '1': 'Basic situation awareness',
      '2': 'Good situation awareness',
      '3': 'Excellent situation awareness'
    },
    history: {
      '0': 'Not demonstrated', 
      '1': 'Minimal history taking',
      '2': 'Adequate history taking',
      '3': 'Comprehensive history'
    },
    examination: {
      '0': 'Not demonstrated',
      '1': 'Limited examination',
      '2': 'Systematic examination', 
      '3': 'Thorough examination'
    },
    assessment: {
      '0': 'Not demonstrated',
      '1': 'Basic assessment',
      '2': 'Good assessment',
      '3': 'Excellent assessment'
    },
    recommendation: {
      '0': 'Not demonstrated',
      '1': 'Basic recommendation', 
      '2': 'Good recommendation',
      '3': 'Excellent recommendation'
    },
    grs: {
      '0': 'Extensive questioning',
      '1': 'Moderate questioning', 
      '2': 'Some questioning',
      '3': 'Little/no questioning'
    }
  };
  return labels[category]?.[value] || 'Not selected';
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'ongoing':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};