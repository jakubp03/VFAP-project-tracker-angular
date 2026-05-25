import { Component, OnInit, inject, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ProjectService } from '../../../core/services/project.service';
import { Task, TaskStatus, UpdateTaskRequest } from '../../../core/models/project.models';
import { TaskFormComponent, TaskFormResult } from '../task-form/task-form.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-task-view',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <div class="flex flex-col gap-4 max-w-2xl">
      @if (isLoading() && !task()) {
        <div class="flex justify-center py-12">
          <mat-spinner />
        </div>
      } @else if (task(); as t) {
        <!-- Back link -->
        <a [routerLink]="['/projects', projectId]" class="text-sm text-blue-600 hover:underline">
          ← Back to Project
        </a>

        <!-- Title + actions -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <h2 class="text-2xl font-semibold text-gray-800">{{ t.title }}</h2>
          <div class="flex gap-2">
            <button mat-stroked-button color="warn" (click)="confirmDelete()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
            <button mat-flat-button color="primary" (click)="openEdit()">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
          </div>
        </div>

        <!-- Description -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Description</mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-3">
            <p class="text-gray-700 whitespace-pre-wrap">{{ t.description }}</p>
          </mat-card-content>
        </mat-card>

        <!-- Metadata -->
        <mat-card>
          <mat-card-content class="pt-4">
            <dl class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt class="text-gray-500 font-medium">Status</dt>
                <dd class="mt-1">
                  <span [class]="statusClass(t.status)">{{ statusLabel(t.status) }}</span>
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 font-medium">Due Date</dt>
                <dd class="mt-1 text-gray-800">{{ t.dueDate | date : 'mediumDate' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500 font-medium">Created</dt>
                <dd class="mt-1 text-gray-800">{{ t.createdAt | date : 'medium' }}</dd>
              </div>
              <div>
                <dt class="text-gray-500 font-medium">Updated</dt>
                <dd class="mt-1 text-gray-800">{{ t.updatedAt | date : 'medium' }}</dd>
              </div>
            </dl>
          </mat-card-content>
        </mat-card>
      } @else {
        <p class="text-gray-500">Task not found.</p>
      }
    </div>
  `
})
export class TaskViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly projectId = Number(this.route.snapshot.paramMap.get('projectId'));
  readonly taskId = Number(this.route.snapshot.paramMap.get('taskId'));

  readonly task = computed<Task | undefined>(() => {
    const proj = this.projectService.projects().find(p => p.id === this.projectId);
    return proj?.tasks.find(t => t.id === this.taskId);
  });

  readonly isLoading = this.projectService.isLoading;

  ngOnInit(): void {
    if (!this.task()) {
      this.projectService.fetchById(this.projectId);
    }
  }

  statusLabel(status: TaskStatus): string {
    const labels: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'To Do',
      [TaskStatus.IN_PROGRESS]: 'In Progress',
      [TaskStatus.DONE]: 'Done'
    };
    return labels[status] ?? status;
  }

  statusClass(status: TaskStatus): string {
    const classes: Record<TaskStatus, string> = {
      [TaskStatus.TODO]: 'px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700',
      [TaskStatus.IN_PROGRESS]: 'px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700',
      [TaskStatus.DONE]: 'px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700'
    };
    return classes[status] ?? '';
  }

  openEdit(): void {
    const ref = this.dialog.open(TaskFormComponent, {
      data: { task: this.task() },
      width: '480px'
    });

    ref.afterClosed().subscribe((result: TaskFormResult | undefined) => {
      if (!result) return;

      if (result.delete) {
        this.confirmDelete();
        return;
      }

      if (result.data) {
        const updateReq: UpdateTaskRequest = {
          title: result.data.title,
          description: result.data.description,
          dueDate: result.data.dueDate,
          status: result.data.status as TaskStatus
        };
        this.projectService.updateTask(this.projectId, this.taskId, updateReq).subscribe({
          next: () => this.snackBar.open('Task updated', 'Close', { duration: 3000 }),
          error: err => this.snackBar.open(err?.error?.message ?? 'Failed', 'Close', { duration: 4000 })
        });
      }
    });
  }

  confirmDelete(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Delete this task? This action cannot be undone.', confirmLabel: 'Delete' },
      width: '360px'
    });

    ref.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.projectService.deleteTask(this.projectId, this.taskId).subscribe({
        next: () => {
          this.snackBar.open('Task deleted', 'Close', { duration: 3000 });
          this.router.navigate(['/projects', this.projectId]);
        },
        error: err => this.snackBar.open(err?.error?.message ?? 'Failed', 'Close', { duration: 4000 })
      });
    });
  }
}
