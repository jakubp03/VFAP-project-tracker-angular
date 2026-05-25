import { Component, OnInit, inject, computed, signal, effect, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProjectService } from '../../../core/services/project.service';
import { Task, TaskStatus } from '../../../core/models/project.models';
import { ProjectFormComponent, ProjectFormResult } from '../project-form/project-form.component';
import { TaskFormComponent, TaskFormResult } from '../../tasks/task-form/task-form.component';
import { AddUserDialogComponent } from './add-user-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    DatePipe,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatTabsModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="flex flex-col gap-4">
      @if (isLoading() && !project()) {
        <div class="flex justify-center py-12">
          <mat-spinner />
        </div>
      } @else if (project(); as proj) {
        <!-- Header -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <a routerLink="/projects" class="text-sm text-blue-600 hover:underline">
              ← All Projects
            </a>
            <h2 class="text-2xl font-semibold text-gray-800 mt-1">{{ proj.title }}</h2>
            <p class="text-gray-500 text-sm mt-0.5">{{ proj.description }}</p>
          </div>
          <div class="flex gap-2">
            <button mat-stroked-button (click)="openAddUser()">
              <mat-icon>person_add</mat-icon>
              Add User
            </button>
            <button mat-stroked-button (click)="openEditProject()">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-flat-button color="primary" (click)="openCreateTask()">
              <mat-icon>add</mat-icon>
              New Task
            </button>
          </div>
        </div>

        <!-- Search -->
        <mat-form-field appearance="outline" class="w-full max-w-sm">
          <mat-label>Search tasks</mat-label>
          <mat-icon matPrefix>search</mat-icon>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="applyFilter($event)" />
        </mat-form-field>

        <!-- Task filter tabs -->
        <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
          <mat-tab label="All" />
          <mat-tab label="To Do" />
          <mat-tab label="In Progress" />
          <mat-tab label="Done" />
        </mat-tab-group>


        <!-- Task table -->
        <div class="rounded-lg overflow-hidden shadow-sm bg-white">
          <mat-table [dataSource]="dataSource" matSort class="w-full">
            <!-- Title -->
            <ng-container matColumnDef="title">
              <mat-header-cell *matHeaderCellDef mat-sort-header class="font-semibold"
                >Title</mat-header-cell
              >
              <mat-cell *matCellDef="let task" class="font-medium">{{ task.title }}</mat-cell>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <mat-header-cell *matHeaderCellDef class="font-semibold">Status</mat-header-cell>
              <mat-cell *matCellDef="let task">
                <span [class]="statusClass(task.status)">{{ statusLabel(task.status) }}</span>
              </mat-cell>
            </ng-container>

            <!-- Due Date -->
            <ng-container matColumnDef="dueDate">
              <mat-header-cell *matHeaderCellDef mat-sort-header class="font-semibold"
                >Due Date</mat-header-cell
              >
              <mat-cell *matCellDef="let task">{{ task.dueDate | date : 'mediumDate' }}</mat-cell>
            </ng-container>

            <!-- Updated At -->
            <ng-container matColumnDef="updatedAt">
              <mat-header-cell *matHeaderCellDef mat-sort-header class="font-semibold"
                >Updated</mat-header-cell
              >
              <mat-cell *matCellDef="let task">{{
                task.updatedAt | date : 'mediumDate'
              }}</mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="displayedColumns" class="bg-gray-50" />
            <mat-row
              *matRowDef="let row; columns: displayedColumns"
              class="cursor-pointer hover:bg-gray-50 transition-colors"
              (click)="navigateToTask(row)"
            />

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell py-8 text-center text-gray-500" [attr.colspan]="4">
                No tasks found.
              </td>
            </tr>
          </mat-table>
        </div>

        <mat-paginator [pageSizeOptions]="[5, 10, 25]" showFirstLastButtons />
      } @else {
        <p class="text-gray-500">Project not found.</p>
      }
    </div>
  `
})
export class ProjectViewComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }

  readonly projectId = Number(this.route.snapshot.paramMap.get('projectId'));
  readonly project = computed(() =>
    this.projectService.projects().find(p => p.id === this.projectId)
  );
  readonly isLoading = this.projectService.isLoading;

  readonly displayedColumns = ['title', 'status', 'dueDate', 'updatedAt'];
  readonly dataSource = new MatTableDataSource<Task>([]);

  private selectedTabIndex = 0;
  searchQuery = '';

  constructor() {
    effect(() => {
      const proj = this.project();
      if (!proj) return;
      this.filterTasks(proj.tasks);
    });
  }

  ngOnInit(): void {
    if (!this.project()) {
      this.projectService.fetchById(this.projectId);
    }
  }

  private filterTasks(tasks: Task[]): void {
    const statusFilters: (TaskStatus | null)[] = [null, TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
    const selectedStatus = statusFilters[this.selectedTabIndex];
    const filtered = selectedStatus ? tasks.filter(t => t.status === selectedStatus) : tasks;
    this.dataSource.data = filtered;
    if (this.searchQuery) {
      this.dataSource.filter = this.searchQuery.trim().toLowerCase();
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    const proj = this.project();
    if (proj) this.filterTasks(proj.tasks);
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
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

  navigateToTask(task: Task): void {
    this.router.navigate(['/projects', this.projectId, 'tasks', task.id]);
  }

  openAddUser(): void {
    const ref = this.dialog.open(AddUserDialogComponent, { width: '380px' });
    ref.afterClosed().subscribe((email: string | undefined) => {
      if (!email) return;
      this.projectService.addUserToProject(this.projectId, email).subscribe({
        next: () => this.snackBar.open('User added', 'Close', { duration: 3000 }),
        error: err => {
          const msg = err?.error?.message ?? 'Failed to add user';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
        }
      });
    });
  }

  openEditProject(): void {
    const proj = this.project();
    const ref = this.dialog.open(ProjectFormComponent, {
      data: { project: proj },
      width: '480px'
    });

    ref.afterClosed().subscribe((result: ProjectFormResult | undefined) => {
      if (!result) return;

      if (result.archive) {
        const confirmRef = this.dialog.open(ConfirmDialogComponent, {
          data: { message: 'Archive this project? It will be marked as archived.' },
          width: '360px'
        });
        confirmRef.afterClosed().subscribe((confirmed: boolean) => {
          if (!confirmed) return;
          this.projectService.archiveProject(this.projectId).subscribe({
            next: () => this.snackBar.open('Project archived', 'Close', { duration: 3000 }),
            error: err => this.snackBar.open(err?.error?.message ?? 'Failed', 'Close', { duration: 4000 })
          });
        });
        return;
      }

      if (result.data) {
        this.projectService.updateProject(this.projectId, result.data).subscribe({
          next: () => this.snackBar.open('Project updated', 'Close', { duration: 3000 }),
          error: err => this.snackBar.open(err?.error?.message ?? 'Failed', 'Close', { duration: 4000 })
        });
      }
    });
  }

  openCreateTask(): void {
    const ref = this.dialog.open(TaskFormComponent, {
      data: {},
      width: '480px'
    });

    ref.afterClosed().subscribe((result: TaskFormResult | undefined) => {
      if (!result?.data) return;
      this.projectService.createTask(this.projectId, result.data).subscribe({
        next: () => this.snackBar.open('Task created', 'Close', { duration: 3000 }),
        error: err => this.snackBar.open(err?.error?.message ?? 'Failed', 'Close', { duration: 4000 })
      });
    });
  }
}
