import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Project,
  Task,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateTaskRequest,
  UpdateTaskRequest
} from '../models/project.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private readonly _projects = signal<Project[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly projects = this._projects.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  private upsertProject(project: Project): void {
    this._projects.update(projects => {
      const idx = projects.findIndex(p => p.id === project.id);
      if (idx >= 0) {
        const updated = [...projects];
        updated[idx] = project;
        return updated;
      }
      return [...projects, project];
    });
  }

  getProjectById(id: number): Project | undefined {
    return this._projects().find(p => p.id === id);
  }

  clearProjects(): void {
    this._projects.set([]);
  }

  fetchAll(): void {
    this._isLoading.set(true);
    this._error.set(null);
    this.http.get<Project[]>(`${this.baseUrl}/projects`).subscribe({
      next: projects => {
        this._projects.set(projects);
        this._isLoading.set(false);
      },
      error: err => {
        this._error.set(err.message);
        this._isLoading.set(false);
      }
    });
  }

  fetchById(projectId: number): void {
    this._isLoading.set(true);
    this.http.get<Project>(`${this.baseUrl}/projects/${projectId}`).subscribe({
      next: project => {
        this.upsertProject(project);
        this._isLoading.set(false);
      },
      error: err => {
        this._error.set(err.message);
        this._isLoading.set(false);
      }
    });
  }

  createProject(data: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, data).pipe(
      tap(project => this.upsertProject(project))
    );
  }

  updateProject(projectId: number, data: UpdateProjectRequest): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/projects/${projectId}`, data).pipe(
      tap(project => this.upsertProject(project))
    );
  }

  archiveProject(projectId: number): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/projects/${projectId}/archive`, {}).pipe(
      tap(project => this.upsertProject(project))
    );
  }

  addUserToProject(projectId: number, userEmail: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/projects/${projectId}/users`, { userEmail });
  }

  createTask(projectId: number, data: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(`${this.baseUrl}/projects/${projectId}/tasks`, data).pipe(
      tap(task => {
        this._projects.update(projects =>
          projects.map(p =>
            p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p
          )
        );
      })
    );
  }

  updateTask(projectId: number, taskId: number, data: UpdateTaskRequest): Observable<Task> {
    return this.http
      .put<Task>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`, data)
      .pipe(
        tap(task => {
          this._projects.update(projects =>
            projects.map(p =>
              p.id === projectId
                ? { ...p, tasks: p.tasks.map(t => (t.id === taskId ? task : t)) }
                : p
            )
          );
        })
      );
  }

  deleteTask(projectId: number, taskId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${projectId}/tasks/${taskId}`).pipe(
      tap(() => {
        this._projects.update(projects =>
          projects.map(p =>
            p.id === projectId ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) } : p
          )
        );
      })
    );
  }
}
