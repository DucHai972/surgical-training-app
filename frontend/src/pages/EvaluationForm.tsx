import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

interface EvaluationFormData {
  session: string;
  identification: string;
  situation: string;
  history: string;
  examination: string;
  assessment: string;
  recommendation: string;
  grs: string;
  comment: string;
}

const EvaluationForm = () => {
  const { sessionName } = useParams<{ sessionName: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<EvaluationFormData>({
    session: sessionName || '',
    identification: '',
    situation: '',
    history: '',
    examination: '',
    assessment: '',
    recommendation: '',
    grs: '',
    comment: ''
  });

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues(prev => ({
      ...prev,
      comment: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all required fields are filled
    const requiredFields = ['identification', 'situation', 'history', 'examination', 'assessment', 'recommendation', 'grs'];
    const missingFields = requiredFields.filter(field => !formValues[field as keyof EvaluationFormData]);

    if (missingFields.length > 0) {
      toast.error('Please complete all evaluation criteria');
      return;
    }

    setLoading(true);

    try {
      // Get CSRF token
      const csrfToken = (window as any).csrf_token || '';
      
      const response = await fetch(
        '/api/method/surgical_training.surgical_training.api.evaluation.add_evaluation',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Frappe-CSRF-Token': csrfToken,
            'Accept': 'application/json'
          },
          body: JSON.stringify(formValues)
        }
      );

      const result = await response.json();

      if (response.ok && result?.message?.message === 'Success') {
        toast.success('Evaluation submitted successfully');
        // Redirect back to the session detail page
        navigate(`/session/${sessionName}`);
      } else {
        console.error('API Error:', result);
        toast.error(result?.message?.error || 'Failed to submit evaluation');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast.error('Failed to submit evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="evaluation" />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Session Evaluation</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              Evaluate performance for session: {sessionName}
            </p>
          </div>

          <Button
            asChild
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
          >
            <Link to={`/session/${sessionName}`} className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Session
            </Link>
          </Button>
        </div>

        <Card className="bg-white dark:bg-gray-800 border-0 shadow-xl mb-8">
          <CardHeader>
            <CardTitle>Performance Evaluation</CardTitle>
            <CardDescription>
              Please rate the performance for each category from 0 (Not performed competently) to 3 (Able to perform under minimal direction)
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <caption className="bg-gray-100 dark:bg-gray-700 p-3 text-lg font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                    Session Evaluation - {new Date().toLocaleDateString()}
                  </caption>
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <th className="border border-gray-200 dark:border-gray-700 p-3 text-left">Category</th>
                      <th className="border border-gray-200 dark:border-gray-700 p-3 text-center">Not performed competently (0)</th>
                      <th className="border border-gray-200 dark:border-gray-700 p-3 text-center">Able to perform under firm direction (1)</th>
                      <th className="border border-gray-200 dark:border-gray-700 p-3 text-center">Able to perform under modest direction (2)</th>
                      <th className="border border-gray-200 dark:border-gray-700 p-3 text-center">Able to perform under minimal direction (3)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={5} className="bg-gray-50 border border-gray-200 dark:border-gray-700 p-3 text-center font-bold py-2"><strong>Identification</strong></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <strong>Identification</strong><br />
                        Identification of:<br />
                        1) self<br />
                        2) role<br />
                        3) patient
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="identification"
                            value="0"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Requires direct prompting</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="identification"
                            value="1"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Introduces themselves but only after a hint</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="identification"
                            value="2"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Introduces themselves but information is incomplete</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="identification"
                            value="3"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Introduces themselves and information is complete</span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={5} className="bg-gray-50 border border-gray-200 dark:border-gray-700 p-3 text-center font-bold py-2"><strong>Situation</strong></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <strong>Identifies main problem(s)</strong>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="situation"
                            value="0"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Unable to identify the main problem(s)</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="situation"
                            value="1"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Identifies the main problem(s) after extended prompting</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="situation"
                            value="2"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Identifies the main problem(s) with few prompts needed</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="situation"
                            value="3"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Identifies and prioritises the main problem(s) unprompted</span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={5} className="bg-gray-50 border border-gray-200 dark:border-gray-700 p-3 text-center font-bold py-2"><strong>Background</strong></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <strong>Gives appropriate history</strong>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="history"
                            value="0"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">History is unstructured, or contains non-relevant information</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="history"
                            value="1"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Relevant history but frequent clarification needed</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="history"
                            value="2"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Relevant history with few further questions needed</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="history"
                            value="3"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Comprehensive focused history</span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <strong>Gives appropriate examination/observations</strong>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="examination"
                            value="0"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Observations are omitted or irrelevant</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="examination"
                            value="1"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Reported but frequent clarification needed</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="examination"
                            value="2"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Reported with few questions needed</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="examination"
                            value="3"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Comprehensive focused observations</span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={5} className="bg-gray-50 border border-gray-200 dark:border-gray-700 p-3 text-center font-bold py-2"><strong>Assessment</strong></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <strong>Makes logical assessment</strong><br />
                        (Correlates problem, history, exam and context)
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="assessment"
                            value="0"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">No logical assessment given</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="assessment"
                            value="1"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Logical only after extended questioning</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="assessment"
                            value="2"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Logical after minimal questioning</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="assessment"
                            value="3"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Comprehensive logical assessment without questioning</span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td colSpan={5} className="bg-gray-50 border border-gray-200 dark:border-gray-700 p-3 text-center font-bold py-2"><strong>Recommendation</strong></td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <strong>Makes a clear recommendation</strong>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="recommendation"
                            value="0"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">No clear recommendation is made</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="recommendation"
                            value="1"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Only after extended questioning</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="recommendation"
                            value="2"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">After minimal questioning</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="recommendation"
                            value="3"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Without questioning</span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <strong>Global Rating Scale (GRS)</strong><br />
                        How confident am I that I received an accurate picture of the patient?
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="grs"
                            value="0"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Not at all confident</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="grs"
                            value="1"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Confident but required extended questioning</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="grs"
                            value="2"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Confident but required some further questioning</span>
                        </label>
                      </td>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 text-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="grs"
                            value="3"
                            onChange={handleRadioChange}
                            className="form-radio text-indigo-600"
                          />
                          <span className="ml-2">Confident and required little or no questioning</span>
                        </label>
                      </td>
                    </tr>

                    <tr>
                      <td className="border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                        <strong>Ungraded observation of additional factors impacting the quality of the handover</strong>
                      </td>
                      <td colSpan={4} className="bg-gray-50 border border-gray-200 dark:border-gray-700 p-3">
                        <input
                          type="text"
                          name="comment"
                          placeholder="Please comment"
                          value={formValues.comment}
                          onChange={handleCommentChange}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/session/${sessionName}`)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? 'Submitting...' : 'Submit Evaluation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EvaluationForm; 