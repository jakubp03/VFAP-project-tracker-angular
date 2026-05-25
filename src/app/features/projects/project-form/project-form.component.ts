import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Project, CreateProjectRequest } from '../../../core/models/project.models';

export interface ProjectFormDialogData {
  project?: Project;
}

export interface ProjectFormResult {
  data?: CreateProjectRequest;
  archive?: boolean;
}

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Edit Project' : 'New Project' }}</h2>

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
        <button mat-stroked-button color="warn" (click)="onArchive()">Archive</button>
      }
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()">
        {{ isEdit() ? 'Save' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `
})
export class ProjectFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProjectFormComponent>);
  readonly data = inject<ProjectFormDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = signal(!!this.data?.project);

  readonly form = this.fb.nonNullable.group({
    title: [this.data?.project?.title ?? '', [Validators.required, Validators.minLength(3)]],
    description: [
      this.data?.project?.description ?? '',
      [Validators.required, Validators.minLength(10)]
    ],
    dueDate: [
      this.data?.project?.dueDate ? new Date(this.data.project.dueDate) : (null as Date | null),
      Validators.required
    ]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { title, description, dueDate } = this.form.getRawValue();
    const result: ProjectFormResult = {
      data: {
        title,
        description,
        dueDate: (dueDate as Date).toISOString()
      }
    };
    this.dialogRef.close(result);
  }

  onArchive(): void {
    this.dialogRef.close({ archive: true } as ProjectFormResult);
  }
}
