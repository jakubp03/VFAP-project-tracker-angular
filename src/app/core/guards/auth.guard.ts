import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return combineLatest([
    toObservable(authService.isValidating),
    toObservable(authService.isAuthenticated)
  ]).pipe(
    filter(([isValidating]) => !isValidating),
    take(1),
    map(([, isAuthenticated]) => {
      if (isAuthenticated) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
