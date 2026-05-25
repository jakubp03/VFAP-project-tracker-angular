export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export interface Task {
  id: number;
  projectId: number;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  dueDate: string;
}

export interface UpdateProjectRequest {
  title: string;
  description: string;
  dueDate: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate: string;
  status?: TaskStatus;
}

export interface UpdateTaskRequest {
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
}
