import React, { useEffect, useState } from 'react';
import { getTasks } from '../../../services/taskService';
import { Task } from '../Tasks/types';
import TaskCard from '../Tasks/TaskCard';

const TaskAssigned: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const allTasks = await getTasks();
        const inProgressTasks = allTasks.filter((task: Task) => task.status === 'inProgress');
        setTasks(inProgressTasks);
      } catch (err) {
        setError('Failed to fetch tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Assigned In-Progress Tasks</h2>
      {loading && <div>Loading tasks...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {!loading && !error && tasks.length === 0 && (
        <div className="text-gray-500">No in-progress tasks assigned.</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
};

export default TaskAssigned; 