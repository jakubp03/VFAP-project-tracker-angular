import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-add-user-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Add User to Project</h2>
    <mat-dialog-content class="pt-2 min-w-72">
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>User Email</mat-label>
          <input matInput type="email" formControlName="email" />
          @if (form.get('email')?.invalid && form.get('email')?.touched) {
            <mat-error>Valid email is required</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="pb-4 pr-4 gap-2">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()">Add</button>
    </mat-dialog-actions>
  `
})
export class AddUserDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddUserDialogComponent>);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue().email);
  }
}
