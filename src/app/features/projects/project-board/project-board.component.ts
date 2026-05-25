import { Component, OnInit, inject, effect, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.models';
import {
  ProjectFormComponent,
  ProjectFormResult
} from '../project-form/project-form.component';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    DatePipe
  ],
  template: `
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-gray-800">Projects</h2>
        <button mat-flat-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon>
          New Project
        </button>
      </div>

      <!-- Search -->
      <mat-form-field appearance="outline" class="w-full max-w-sm">
        <mat-label>Search projects</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [(ngModel)]="searchQuery" (ngModelChange)="applyFilter($event)" />
      </mat-form-field>

      @if (isLoading()) {
        <div class="flex justify-center py-12">
          <mat-spinner />
        </div>
      } @else {
        <!-- Table -->
        <div class="rounded-lg overflow-hidden shadow-sm bg-white">
          <mat-table [dataSource]="dataSource" matSort class="w-full">
            <!-- Title Column -->
            <ng-container matColumnDef="title">
              <mat-header-cell *matHeaderCellDef mat-sort-header class="font-semibold"
                >Title</mat-header-cell
              >
              <mat-cell *matCellDef="let project" class="font-medium">
                {{ project.title }}
              </mat-cell>
            </ng-container>

            <!-- Tasks Column -->
            <ng-container matColumnDef="tasks">
              <mat-header-cell *matHeaderCellDef class="font-semibold">Tasks</mat-header-cell>
              <mat-cell *matCellDef="let project">
                {{ doneTasks(project) }} / {{ project.tasks.length }}
              </mat-cell>
            </ng-container>

            <!-- Due Date Column -->
            <ng-container matColumnDef="dueDate">
              <mat-header-cell *matHeaderCellDef mat-sort-header class="font-semibold"
                >Due Date</mat-header-cell
              >
              <mat-cell *matCellDef="let project">
                {{ project.dueDate | date : 'mediumDate' }}
              </mat-cell>
            </ng-container>

            <!-- Updated At Column -->
            <ng-container matColumnDef="updatedAt">
              <mat-header-cell *matHeaderCellDef mat-sort-header class="font-semibold"
                >Updated</mat-header-cell
              >
              <mat-cell *matCellDef="let project">
                {{ project.updatedAt | date : 'mediumDate' }}
              </mat-cell>
            </ng-container>

            <!-- Archived Column -->
            <ng-container matColumnDef="isArchived">
              <mat-header-cell *matHeaderCellDef class="font-semibold">Status</mat-header-cell>
              <mat-cell *matCellDef="let project">
                @if (project.isArchived) {
                  <span class="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600"
                    >Archived</span
                  >
                } @else {
                  <span class="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700"
                    >Active</span
                  >
                }
              </mat-cell>
            </ng-container>

            <mat-header-row *matHeaderRowDef="displayedColumns" class="bg-gray-50" />
            <mat-row
              *matRowDef="let row; columns: displayedColumns"
              class="cursor-pointer hover:bg-gray-50 transition-colors"
              (click)="navigate(row)"
            />

            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell py-8 text-center text-gray-500" [attr.colspan]="5">
                No projects found.
              </td>
            </tr>
          </mat-table>
        </div>

        <mat-paginator [pageSizeOptions]="[5, 10, 15]" showFirstLastButtons />
      }
    </div>
  `
})
export class ProjectBoardComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  @ViewChild(MatSort) set matSort(sort: MatSort) {
    this.dataSource.sort = sort;
  }

  @ViewChild(MatPaginator) set matPaginator(paginator: MatPaginator) {
    this.dataSource.paginator = paginator;
  }

  readonly isLoading = this.projectService.isLoading;
  readonly displayedColumns = ['title', 'tasks', 'dueDate', 'updatedAt', 'isArchived'];
  readonly dataSource = new MatTableDataSource<Project>([]);

  searchQuery = '';

  constructor() {
    // Keep MatTableDataSource in sync with the projects signal
    effect(() => {
      this.dataSource.data = this.projectService.projects();
    });
  }

  ngOnInit(): void {
    this.projectService.fetchAll();
  }

  doneTasks(project: Project): number {
    return project.tasks.filter(t => t.status === 'DONE').length;
  }

  applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
  }

  navigate(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ProjectFormComponent, {
      data: {},
      width: '480px'
    });

    ref.afterClosed().subscribe((result: ProjectFormResult | undefined) => {
      if (!result?.data) return;
      this.projectService.createProject(result.data).subscribe({
        next: () => {
          this.snackBar.open('Project created', 'Close', { duration: 3000 });
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to create project';
          this.snackBar.open(msg, 'Close', { duration: 4000 });
        }
      });
    });
  }
}
