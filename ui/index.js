import React, { useState, useEffect } from 'react';
import { Upload, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

function App() {
  const [view, setView] = useState('login');
  const [userType, setUserType] = useState(null);
  const [assessmentConfig, setAssessmentConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [levels, setLevels] = useState([]);
  const [csvFile, setCsvFile] = useState(null);

  // Timer effect
  useEffect(() => {
    if (view === 'assessment' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogin = (type) => {
    setUserType(type);
    if (type === 'admin') {
      setView('admin');
      fetchLevels();
    } else {
      setView('student-config');
      fetchLevels();
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await fetch(`${API_BASE}/levels`);
      const data = await response.json();
      setLevels(data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const handleFileUpload = async () => {
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await fetch(`${API_BASE}/upload-questions`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      alert(data.message || 'Questions uploaded successfully');
      setCsvFile(null);
      fetchLevels();
    } catch (error) {
      alert('Error uploading questions: ' + error.message);
    }
  };

  const startAssessment = async (config) => {
    try {
      const response = await fetch(`${API_BASE}/start-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      
      setQuestions(data.questions);
      setAssessmentConfig(config);
      setTimeLeft(config.totalTime * 60);
      setAnswers({});
      setCurrentQuestion(0);
      setView('assessment');
    } catch (error) {
      alert('Error starting assessment: ' + error.message);
    }
  };

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`${API_BASE}/submit-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          answers,
          passPercentage: assessmentConfig.passPercentage
        }),
      });
      const data = await response.json();
      setResult(data);
      setView('result');
    } catch (error) {
      alert('Error submitting assessment: ' + error.message);
    }
  };

  const LoginView = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600">Learning Assessment Platform</h1>
        <div className="space-y-4">
          <button
            onClick={() => handleLogin('admin')}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Admin Login
          </button>
          <button
            onClick={() => handleLogin('student')}
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
          >
            Student Login
          </button>
        </div>
      </div>
    </div>
  );

  const AdminView = () => {
    const [config, setConfig] = useState({
      level: '',
      totalTime: 30,
      passPercentage: 70
    });

    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6 text-indigo-600">Admin Dashboard</h2>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Upload Questions (CSV)</h3>
              <p className="text-sm text-gray-600 mb-4">
                CSV Format: question, option1, option2, option3, option4, correctAnswer(0-3), level
              </p>
              <div className="flex gap-4 items-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="flex-1 border rounded p-2"
                />
                <button
                  onClick={handleFileUpload}
                  className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Upload size={20} />
                  Upload
                </button>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-xl font-semibold mb-4">Assessment Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Level</label>
                  <select
                    value={config.level}
                    onChange={(e) => setConfig({...config, level: e.target.value})}
                    className="w-full border rounded p-2"
                  >
                    <option value="">Select Level</option>
                    {levels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Time (minutes)</label>
                  <input
                    type="number"
                    value={config.totalTime}
                    onChange={(e) => setConfig({...config, totalTime: parseInt(e.target.value)})}
                    className="w-full border rounded p-2"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pass Percentage</label>
                  <input
                    type="number"
                    value={config.passPercentage}
                    onChange={(e) => setConfig({...config, passPercentage: parseInt(e.target.value)})}
                    className="w-full border rounded p-2"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setView('login')}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StudentConfigView = () => {
    const [config, setConfig] = useState({
      level: '',
      totalTime: 30,
      passPercentage: 70
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-green-600">Start Assessment</h2>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Level</label>
              <select
                value={config.level}
                onChange={(e) => setConfig({...config, level: e.target.value})}
                className="w-full border rounded p-2"
              >
                <option value="">Choose a level</option>
                {levels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
              <input
                type="number"
                value={config.totalTime}
                onChange={(e) => setConfig({...config, totalTime: parseInt(e.target.value)})}
                className="w-full border rounded p-2"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pass Percentage</label>
              <input
                type="number"
                value={config.passPercentage}
                onChange={(e) => setConfig({...config, passPercentage: parseInt(e.target.value)})}
                className="w-full border rounded p-2"
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setView('login')}
              className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600"
            >
              Back
            </button>
            <button
              onClick={() => startAssessment(config)}
              disabled={!config.level}
              className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-gray-300"
            >
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    );
  };

  const AssessmentView = () => {
    const question = questions[currentQuestion];
    if (!question) return null;

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <div className="flex justify-between items-center mb-6">
              <div className="text-lg font-semibold">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <div className="flex items-center gap-2 text-lg font-bold text-red-600">
                <Clock size={24} />
                {formatTime(timeLeft)}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-medium mb-4">{question.question}</h3>
              <div className="space-y-3">
                {question.shuffledOptions.map((option, idx) => (
                  <label
                    key={idx}
                    className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                      answers[question.id] === idx
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answers[question.id] === idx}
                      onChange={() => handleAnswerSelect(question.id, idx)}
                      className="mr-3"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300"
              >
                <ChevronLeft size={20} />
                Previous
              </button>

              <div className="text-sm text-gray-600">
                Answered: {Object.keys(answers).length} / {questions.length}
              </div>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(prev => prev + 1)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Submit Assessment
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4">
            <h4 className="font-semibold mb-3">Question Navigator</h4>
            <div className="grid grid-cols-10 gap-2">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`p-2 rounded text-sm ${
                    idx === currentQuestion
                      ? 'bg-blue-600 text-white'
                      : answers[questions[idx].id] !== undefined
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResultView = () => {
    const passed = result.percentage >= result.passPercentage;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            {passed ? (
              <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
            ) : (
              <XCircle size={64} className="mx-auto text-red-500 mb-4" />
            )}
            <h2 className="text-3xl font-bold mb-2">
              {passed ? 'Congratulations!' : 'Assessment Complete'}
            </h2>
            <p className="text-gray-600">
              {passed ? 'You passed the assessment!' : 'Keep practicing!'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="font-medium">Score:</span>
              <span className="font-bold text-xl">{result.score} / {result.total}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Percentage:</span>
              <span className="font-bold text-xl">{result.percentage.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Pass Mark:</span>
              <span>{result.passPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                {passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setView('login');
              setUserType(null);
              setResult(null);
            }}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {view === 'login' && <LoginView />}
      {view === 'admin' && <AdminView />}
      {view === 'student-config' && <StudentConfigView />}
      {view === 'assessment' && <AssessmentView />}
      {view === 'result' && <ResultView />}
    </>
  );
}

export default App;