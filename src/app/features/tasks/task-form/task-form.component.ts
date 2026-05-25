import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Task, TaskStatus, CreateTaskRequest } from '../../../core/models/project.models';

export interface TaskFormDialogData {
  task?: Task;
}

export interface TaskFormResult {
  data?: CreateTaskRequest;
  delete?: boolean;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Edit Task' : 'New Task' }}</h2>

    <mat-dialog-content class="flex flex-col gap-3 min-w-80 pt-2">
      <form [formGroup]="form" class="flex flex-col gap-3">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" />
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <mat-error>Title must be at least 3 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
          @if (form.get('description')?.invalid && form.get('description')?.touched) {
            <mat-error>Description must be at least 10 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="TODO">To Do</mat-option>
            <mat-option value="IN_PROGRESS">In Progress</mat-option>
            <mat-option value="DONE">Done</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Due Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dueDate" />
          <mat-datepicker-toggle matIconSuffix [for]="picker" />
          <mat-datepicker #picker />
          @if (form.get('dueDate')?.invalid && form.get('dueDate')?.touched) {
            <mat-error>Due date is required</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2 pb-4 pr-4">
      @if (isEdit()) {
        <button mat-stroked-button color="warn" (click)="onDelete()">Delete</button>
      }
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()">
        {{ isEdit() ? 'Save' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `
})
export class TaskFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TaskFormComponent>);
  readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = signal(!!this.data?.task);

  readonly form = this.fb.nonNullable.group({
    title: [this.data?.task?.title ?? '', [Validators.required, Validators.minLength(3)]],
    description: [
      this.data?.task?.description ?? '',
      [Validators.required, Validators.minLength(10)]
    ],
    status: [this.data?.task?.status ?? TaskStatus.TODO, Validators.required],
    dueDate: [
      this.data?.task?.dueDate ? new Date(this.data.task.dueDate) : (null as Date | null),
      Validators.required
    ]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, description, status, dueDate } = this.form.getRawValue();
    const result: TaskFormResult = {
      data: {
        title,
        description,
        status: status as TaskStatus,
        dueDate: (dueDate as Date).toISOString()
      }
    };
    this.dialogRef.close(result);
  }

  onDelete(): void {
    this.dialogRef.close({ delete: true } as TaskFormResult);
  }
}
