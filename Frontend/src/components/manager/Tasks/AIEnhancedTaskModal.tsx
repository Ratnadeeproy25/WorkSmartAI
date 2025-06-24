import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import managerTaskService from '../../../services/managerTaskService';
import aiService from '../../../services/aiService';
import { TaskDurationPrediction, TaskComplexityPrediction, AIPrioritySuggestion, EnhancedAssignmentSuggestion, CompletionDatePrediction } from '../../../types/ai';

interface AIEnhancedTaskModalProps {
  taskId: string | null;
  onClose: () => void;
}

interface TeamMember {
  _id: string;
  id: string; // Custom employee ID like "EM001"
  name: string;
  email: string;
  position: string;
  department: string;
}

const AIEnhancedTaskModal: React.FC<AIEnhancedTaskModalProps> = ({ taskId, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [dueDate, setDueDate] = useState<Date | null>(new Date());
  const [assigneeId, setAssigneeId] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI-related state
  const [aiPrediction, setAiPrediction] = useState<{
    duration: TaskDurationPrediction;
    complexity: TaskComplexityPrediction;
  } | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestedAssignee, setSuggestedAssignee] = useState<string | null>(null);
  const [assignmentReasoning, setAssignmentReasoning] = useState('');
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [aiEnabled, setAiEnabled] = useState(true);

  // Enhanced AI features state
  const [prioritySuggestion, setPrioritySuggestion] = useState<AIPrioritySuggestion | null>(null);
  const [enhancedAssignment, setEnhancedAssignment] = useState<EnhancedAssignmentSuggestion | null>(null);
  const [completionPrediction, setCompletionPrediction] = useState<CompletionDatePrediction | null>(null);

  // Fetch team members when component mounts
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const members = await managerTaskService.getTeamMembers();
        setTeamMembers(members);
        
        // Don't automatically set a default assignee - let user select
        // Only set assignee when editing an existing task
      } catch (error) {
        console.error('Error fetching team members:', error);
        setError('Failed to load team members. Please try again later.');
      }
    };
    
    fetchTeamMembers();
  }, []); // Remove assigneeId dependency since we're not auto-selecting anymore

  // Load task data if editing an existing task
  useEffect(() => {
    const fetchTaskData = async () => {
      if (!taskId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const task = await managerTaskService.getTaskById(taskId);
        
        setTitle(task.title);
        setDescription(task.description);
        setPriority(task.priority);
        setStatus(task.status);
        setDueDate(new Date(task.dueDate));
        setAssigneeId(task.assignee.id);
      } catch (error) {
        console.error('Error fetching task:', error);
        setError('Failed to load task data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTaskData();
  }, [taskId]);

  // AI Prediction when task details change
  useEffect(() => {
    const getPrediction = async () => {
      if (!title || !description || !dueDate || !aiEnabled) return;

      setIsAiLoading(true);
      try {
        const taskData = {
          title,
          description,
          priority: priority as 'high' | 'medium' | 'low',
          dueDate: dueDate.toISOString()
        };

        // Get basic predictions (duration and complexity)
        const prediction = await aiService.predictTaskDuration(taskData);
        setAiPrediction({
          duration: prediction.data.duration,
          complexity: prediction.data.complexity
        });

        // 1. Get AI Priority Suggestion based on deadline
        const prioritySugg = await aiService.suggestPriorityBasedOnDeadline(
          dueDate.toISOString(), 
          prediction.data.complexity.complexity
        );
        setPrioritySuggestion(prioritySugg);

        // Get assignment suggestions if team members are available
        if (teamMembers.length > 0) {
          // 2. Get Enhanced Assignment Suggestions with employee performance
          const enhancedSuggestions = await aiService.getEnhancedAssignmentSuggestions(
            teamMembers.map(m => m._id),
            {
              ...taskData,
              estimatedHours: prediction.data.duration.duration
            }
          );
          setEnhancedAssignment(enhancedSuggestions);
          setSuggestedAssignee(enhancedSuggestions.bestAssignee);
          setAssignmentReasoning(enhancedSuggestions.reasoning);

          // 3. Get Completion Date Prediction based on selected assignee
          if (assigneeId || enhancedSuggestions.bestAssignee) {
            const selectedAssignee = assigneeId || enhancedSuggestions.bestAssignee!;
            const completionPred = await aiService.predictCompletionDate(selectedAssignee, {
              title,
              description,
              priority: priority as 'high' | 'medium' | 'low',
              estimatedHours: prediction.data.duration.duration
            });
            setCompletionPrediction(completionPred);
          }
        }
      } catch (error) {
        console.error('Error getting AI prediction:', error);
      } finally {
        setIsAiLoading(false);
      }
    };

    // Debounce the prediction calls
    const timer = setTimeout(getPrediction, 1000);
    return () => clearTimeout(timer);
  }, [title, description, priority, dueDate, teamMembers, assigneeId, aiEnabled]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dueDate) {
      setError('Please set a due date');
      return;
    }
    
    if (!assigneeId) {
      setError('Please select an assignee');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const selectedEmployee = teamMembers.find(member => member._id === assigneeId);
      if (!selectedEmployee?._id) {
        throw new Error("Selected employee doesn't have a valid MongoDB ID");
      }

      const payload = {
        title,
        description,
        priority,
        status,
        dueDate,
        assigneeId: selectedEmployee._id
      };
      
      if (taskId) {
        await managerTaskService.updateTask(taskId, payload);
      } else {
        await managerTaskService.createTask(payload);
      }
      
      // Notify UIs that tasks have been updated
      window.dispatchEvent(new Event('managerTasksUpdated'));
      if (payload.assigneeId) {
        window.dispatchEvent(new Event('employeeTasksUpdated'));
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      setError('Failed to save task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyAISuggestion = () => {
    if (suggestedAssignee) {
      setAssigneeId(suggestedAssignee);
    }
  };

  const applyPrioritySuggestion = () => {
    if (prioritySuggestion) {
      setPriority(prioritySuggestion.suggestedPriority);
    }
  };

  const getPriorityColor = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityLevel = (complexity: number) => {
    if (complexity > 0.7) return { level: 'High', color: 'text-red-600' };
    if (complexity > 0.4) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="neo-box p-6 w-full max-w-4xl mx-4 bg-[#e0e5ec] max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-gray-700">
              {taskId ? 'Edit Task' : 'Create New Task'}
            </h2>
            <div className="flex items-center gap-2">
              <i className="bi bi-robot text-blue-600"></i>
              <span className="text-sm text-gray-600">AI Enhanced</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="flex gap-6 flex-grow overflow-hidden">
            {/* Main Form */}
            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-gray-700 mb-2">Title</label>
                  <input 
                    type="text" 
                    placeholder="Task Title" 
                    className="neo-box w-full p-3 text-gray-700"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Description</label>
                  <ReactQuill 
                    theme="snow" 
                    value={description} 
                    onChange={setDescription}
                    className="neo-box"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Priority
                      {prioritySuggestion && priority !== prioritySuggestion.suggestedPriority && (
                        <button
                          type="button"
                          onClick={applyPrioritySuggestion}
                          className="ml-2 text-sm text-orange-600 hover:text-orange-800"
                        >
                          <i className="bi bi-robot mr-1"></i>AI Suggests: {prioritySuggestion.suggestedPriority}
                        </button>
                      )}
                    </label>
                    <select 
                      className="neo-box w-full p-3 text-gray-700"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">Status</label>
                    <select 
                      className="neo-box w-full p-3 text-gray-700"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="todo">To Do</option>
                      <option value="inProgress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Due Date</label>
                    <Flatpickr
                      value={dueDate || undefined}
                      onChange={(dates) => setDueDate(dates[0])}
                      options={{
                        enableTime: true,
                        dateFormat: "Y-m-d H:i",
                        minDate: "today"
                      }}
                      className="neo-box w-full p-3 text-gray-700"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Assignee
                      {suggestedAssignee && suggestedAssignee !== assigneeId && (
                        <button
                          type="button"
                          onClick={applyAISuggestion}
                          className="ml-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <i className="bi bi-robot mr-1"></i>Apply AI Suggestion
                        </button>
                      )}
                    </label>
                    <select 
                      className="neo-box w-full p-3 text-gray-700"
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      required
                    >
                      <option value="">Select an assignee</option>
                      {teamMembers.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.id} - {member.name} ({member.position})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button 
                    type="button" 
                    className="neo-button px-6 py-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="neo-button primary px-6 py-2"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : (taskId ? 'Update Task' : 'Create Task')}
                  </button>
                </div>
              </form>
            </div>

            {/* AI Insights Panel */}
            {aiEnabled && showAiSuggestions && (
              <div className="w-80 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                    <i className="bi bi-robot text-blue-600"></i>
                    AI Insights
                  </h3>
                  <button
                    onClick={() => setShowAiSuggestions(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>

                {isAiLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="loading-spinner"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Priority Suggestion */}
                    {prioritySuggestion && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <i className="bi bi-exclamation-triangle"></i>
                          AI Priority Suggestion
                        </h4>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(prioritySuggestion.suggestedPriority)}`}>
                            {prioritySuggestion.suggestedPriority.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500">
                            Confidence: {Math.round(prioritySuggestion.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{prioritySuggestion.reasoning}</p>
                        {priority !== prioritySuggestion.suggestedPriority && (
                          <button
                            onClick={applyPrioritySuggestion}
                            className="mt-1 text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded hover:bg-orange-200"
                          >
                            Apply Priority
                          </button>
                        )}
                      </div>
                    )}

                    {/* Duration Prediction */}
                    {aiPrediction && (
                      <>
                        {/* Complexity Analysis */}
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <i className="bi bi-diagram-3"></i>
                            Complexity Analysis
                          </h4>
                          <div className={`text-lg font-semibold mb-1 ${getComplexityLevel(aiPrediction.complexity.complexity).color}`}>
                            {getComplexityLevel(aiPrediction.complexity.complexity).level}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${aiPrediction.complexity.complexity * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {aiPrediction.complexity.factors.length > 0 && (
                              <ul className="list-disc list-inside">
                                {aiPrediction.complexity.factors.slice(0, 2).map((factor, index) => (
                                  <li key={index}>{factor}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Enhanced Assignment Suggestion */}
                    {enhancedAssignment && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <i className="bi bi-person-check"></i>
                          Enhanced Assignment
                        </h4>
                        <div className="text-sm text-gray-600 mb-2">
                          {enhancedAssignment.reasoning}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Confidence: {Math.round(enhancedAssignment.confidence * 100)}%
                        </div>
                        {enhancedAssignment.bestAssignee && enhancedAssignment.bestAssignee !== assigneeId && (
                          <button
                            onClick={applyAISuggestion}
                            className="mt-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                          >
                            Apply Assignment
                          </button>
                        )}
                        
                        {/* Alternative Assignees */}
                        {enhancedAssignment.alternativeAssignees.length > 1 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-600 mb-1">Alternatives:</p>
                            {enhancedAssignment.alternativeAssignees.slice(1, 3).map((alt, index) => (
                              <div key={index} className="text-xs text-gray-500 flex justify-between">
                                <span>{alt.name}</span>
                                <span>{Math.round(alt.overallScore * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completion Date Prediction */}
                    {completionPrediction && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <i className="bi bi-calendar-check"></i>
                          Completion Prediction
                        </h4>
                        <div className="text-lg font-bold text-green-600 mb-1">
                          {new Date(completionPrediction.predictedCompletionDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {completionPrediction.reasoning}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          Confidence: {Math.round(completionPrediction.confidence * 100)}%
                        </div>
                        
                        {/* Risk Factors */}
                        {completionPrediction.riskFactors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-red-600 mb-1">Risk Factors:</p>
                            <ul className="text-xs text-red-500 list-disc list-inside">
                              {completionPrediction.riskFactors.slice(0, 2).map((risk, index) => (
                                <li key={index}>{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Assignment Suggestion - Legacy (keeping for fallback) */}
                    {assignmentReasoning && !enhancedAssignment && (
                      <div className="bg-white rounded-lg p-3 shadow-sm">
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <i className="bi bi-person-check"></i>
                          Assignment Suggestion
                        </h4>
                        <div className="text-sm text-gray-600">
                          {assignmentReasoning}
                        </div>
                        {suggestedAssignee && suggestedAssignee !== assigneeId && (
                          <button
                            onClick={applyAISuggestion}
                            className="mt-2 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                          >
                            Apply Suggestion
                          </button>
                        )}
                      </div>
                    )}

                    {/* AI Tips */}
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <i className="bi bi-lightbulb"></i>
                        Smart Tips
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li className="flex items-start gap-2">
                          <i className="bi bi-check-circle text-green-500 mt-0.5"></i>
                          AI analyzes deadlines to suggest optimal priority
                        </li>
                        <li className="flex items-start gap-2">
                          <i className="bi bi-check-circle text-green-500 mt-0.5"></i>
                          Assignment considers both workload and performance
                        </li>
                        <li className="flex items-start gap-2">
                          <i className="bi bi-check-circle text-green-500 mt-0.5"></i>
                          Completion dates factor in employee capabilities
                        </li>
                      </ul>
                    </div>

                    {/* AI Learning Progress */}
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3 shadow-sm">
                      <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <i className="bi bi-graph-up text-purple-600"></i>
                        AI Learning Progress
                      </h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Model Accuracy:</span>
                          <span className="font-medium text-green-600">
                            {/* This will be updated with real data */}
                            Learning...
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tasks Analyzed:</span>
                          <span className="font-medium text-blue-600">
                            Growing with each completion
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `70%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-purple-600 mt-2 italic">
                          AI improves with every completed task
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          // Show detailed AI status
                          aiService.getAIStatus().then(status => {
                            console.log('AI Status:', status);
                            alert(`AI Learning Status:\n\nAccuracy: ${status.data.modelPerformance.accuracy}%\nTasks Used for Training: ${status.data.learningProgress.tasksUsedForTraining}\nStatus: ${status.data.modelPerformance.status}\n\nThe AI continuously learns from completed tasks to improve its predictions!`);
                          }).catch(err => {
                            console.error('Error fetching AI status:', err);
                            alert('AI is learning and improving with each completed task!');
                          });
                        }}
                        className="mt-2 text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors"
                      >
                        View AI Performance
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 20px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          -webkit-transition: .4s;
          transition: .4s;
          border-radius: 20px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          -webkit-transition: .4s;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: #2196F3;
        }

        input:checked + .slider:before {
          -webkit-transform: translateX(20px);
          -ms-transform: translateX(20px);
          transform: translateX(20px);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default AIEnhancedTaskModal; 