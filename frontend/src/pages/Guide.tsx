import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BookOpen, Video, FileText, ChevronRight, Play } from 'lucide-react';
import Navbar from '../components/Navbar';

interface GuideSection {
  title: string;
  description: string;
  icon: React.ElementType;
  items: GuideItem[];
}

interface GuideItem {
  title: string;
  description: string;
  type: 'video' | 'document';
  link: string;
}

const Guide = () => {
  const guideSections: GuideSection[] = [
    {
      title: 'Getting Started',
      description: 'Essential guides for new users',
      icon: BookOpen,
      items: [
        {
          title: 'Platform Overview',
          description: 'Learn about the key features and navigation',
          type: 'video',
          link: '#'
        },
        {
          title: 'Quick Start Guide',
          description: 'Step-by-step guide to begin your training',
          type: 'document',
          link: '#'
        }
      ]
    },
    {
      title: 'Training Techniques',
      description: 'Advanced surgical training methodologies',
      icon: Video,
      items: [
        {
          title: 'Basic Surgical Techniques',
          description: 'Fundamental surgical procedures and best practices',
          type: 'video',
          link: '#'
        },
        {
          title: 'Advanced Procedures',
          description: 'Complex surgical techniques and specialized procedures',
          type: 'video',
          link: '#'
        }
      ]
    },
    {
      title: 'Documentation',
      description: 'Detailed documentation and resources',
      icon: FileText,
      items: [
        {
          title: 'Training Manual',
          description: 'Comprehensive guide to surgical training procedures',
          type: 'document',
          link: '#'
        },
        {
          title: 'Best Practices',
          description: 'Guidelines and recommendations for optimal training',
          type: 'document',
          link: '#'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="guide" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Training Guide
          </h2>
          <p className="text-gray-600">
            Comprehensive resources and documentation for surgical training
          </p>
        </div>

        {/* Guide Sections */}
        <div className="grid grid-cols-1 gap-8">
          {guideSections.map((section, sectionIndex) => (
            <Card key={sectionIndex} className="bg-white border border-gray-200 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <section.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {section.items.map((item, itemIndex) => (
                  <Card 
                    key={itemIndex}
                    className="group hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.description}
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg ${
                          item.type === 'video' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                          {item.type === 'video' ? (
                            <Play className="w-4 h-4 text-blue-600" />
                          ) : (
                            <FileText className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>
                      <Button 
                        className="w-full mt-4 group bg-gray-50 hover:bg-gray-100 text-gray-700"
                        variant="ghost"
                      >
                        <span>View {item.type === 'video' ? 'Video' : 'Document'}</span>
                        <ChevronRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Guide; 