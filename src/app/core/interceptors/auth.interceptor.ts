import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse, HttpClient } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const http = inject(HttpClient);

  // Read directly from localStorage — the source of truth — to avoid signal timing issues on reload
  const token = localStorage.getItem('accessToken');

  const isPublic =
    req.url.includes('/auth/authenticate') ||
    req.url.includes('/auth/register');

  const authReq =
    token && !isPublic
      ? req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
          withCredentials: true
        })
      : req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !isPublic &&
        !isRefreshing
      ) {
        isRefreshing = true;

        return http
          .post<{ access_token: string }>(
            `${environment.apiBaseUrl}/auth/refresh`,
            {},
            { withCredentials: true }
          )
          .pipe(
            switchMap(({ access_token }) => {
              isRefreshing = false;
              authService.setToken(access_token);
              const retried = req.clone({
                setHeaders: { Authorization: `Bearer ${access_token}` },
                withCredentials: true
              });
              return next(retried);
            }),
            catchError(refreshError => {
              isRefreshing = false;
              authService.clearAuth();
              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
      }
      return throwError(() => error);
    })
  );
};
