import { inject } from '@angular/core';
import {
  HttpInterceptorFn
} from '@angular/common/http';
import { from, switchMap, throwError} from 'rxjs';
import { AuthService } from '../services/auth.service';
import {catchError} from 'rxjs/operators';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/login') ||
    req.url.includes('/auth/logout') ||
    req.url.includes('/public/')) {
    return next(req.clone({ withCredentials: true }));
  }

  const authService = inject(AuthService);

  return from(authService.getIdToken(false)).pipe(
    switchMap(token => {
      let authReq = req.clone({
        withCredentials: true
      });

      if (token) {
        authReq = authReq.clone({
          headers: authReq.headers.set('Authorization', `Bearer ${token}`)
        });
      }

      return next(authReq);
    }),
    catchError(error => {
      if (error.status === 401) {
        return from(authService.getIdToken(true)).pipe(
          switchMap(newToken => {
            if (newToken) {
              const retryReq = req.clone({
                withCredentials: true,
                headers: req.headers.set('Authorization', `Bearer ${newToken}`)
              });
              return next(retryReq);
            }
            throw error;
          }),
          catchError(() => throwError(() => error))
        );
      }
      return throwError(() => error);
    })
  );
};
