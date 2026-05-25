import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <mat-card class="w-full max-w-sm">
        <mat-card-header>
          <mat-card-title class="text-2xl font-semibold mb-2">Sign In</mat-card-title>
          <mat-card-subtitle>Welcome back to VFAP</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="pt-4">
          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <mat-error>Valid email is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                autocomplete="current-password"
              />
              <button
                type="button"
                mat-icon-button
                matSuffix
                (click)="hidePassword.set(!hidePassword())"
                [attr.aria-label]="'Toggle password visibility'"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="w-full"
              [disabled]="loading()"
            >
              @if (loading()) {
                <mat-spinner diameter="20" class="inline-block" />
              } @else {
                Sign In
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-actions class="px-4 pb-4">
          <p class="text-sm text-gray-600 text-center w-full">
            Don't have an account?
            <a routerLink="/register" class="text-blue-600 hover:underline">Register</a>
          </p>
        </mat-card-actions>
      </mat-card>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly hidePassword = signal(true);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/']);
      },
      error: err => {
        this.loading.set(false);
        const msg = err?.error?.message ?? 'Invalid credentials';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      }
    });
  }
}
