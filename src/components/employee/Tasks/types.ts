export type TaskStatus = 'todo' | 'inProgress' | 'completed' | 'blocked';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  assignee: {
    id: string;
    name: string;
    color: string;
  };
  progress: number;
  createdAt: string;
  timeSpent?: number;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskColumn {
  id: string;
  title: string;
  color: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface TaskCountsProps {
  total: number;
  inProgress: number;
  completed: number;
  blocked: number;
} 