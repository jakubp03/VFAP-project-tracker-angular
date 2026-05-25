import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/auth.models';
import { environment } from '../../../environments/environment';

function parseJWT(token: string): User {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { email: payload.sub ?? null, name: payload.name ?? null, uid: payload.uid ?? null };
  } catch {
    return { email: null, name: null, uid: null };
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(localStorage.getItem('accessToken'));
  private readonly _isValidating = signal(true);

  readonly token = this._token.asReadonly();
  readonly isValidating = this._isValidating.asReadonly();
  readonly user = computed<User>(() => {
    const token = this._token();
    return token ? parseJWT(token) : { email: null, name: null, uid: null };
  });
  readonly isAuthenticated = computed(() => !!this._token());

  setToken(token: string | null): void {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
    this._token.set(token);
  }

  clearAuth(): void {
    localStorage.removeItem('accessToken');
    this._token.set(null);
    this._isValidating.set(false);
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiBaseUrl}/auth/authenticate`, data).pipe(
      tap(response => this.setToken(response.access_token))
    );
  }

  register(data: RegisterRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/register`, data);
  }

  refresh(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.apiBaseUrl}/auth/refresh`,
      {},
      { withCredentials: true }
    );
  }

  validateToken(): void {
    this._isValidating.set(true);
    if (!this._token()) {
      this._isValidating.set(false);
      return;
    }
    this.http.get(`${environment.apiBaseUrl}/auth/validateToken`, { responseType: 'text' }).subscribe({
      next: () => this._isValidating.set(false),
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.clearAuth();
        } else {
          this._isValidating.set(false);
        }
      }
    });
  }

  logout(): void {
    this.http.post(`${environment.apiBaseUrl}/auth/logout`, {}).subscribe({
      complete: () => {
        this.clearAuth();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.clearAuth();
        this.router.navigate(['/login']);
      }
    });
  }
}
