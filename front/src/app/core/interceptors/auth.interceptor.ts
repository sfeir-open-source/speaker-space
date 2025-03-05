// src/app/common/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, getIdToken } from '@angular/fire/auth';
import { from, switchMap, catchError, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  if (!auth.currentUser) {
    console.log('No current user, skipping auth token');
    return next(req);
  }

  console.log('Adding auth token to request');
  return from(getIdToken(auth.currentUser, true)).pipe(
    switchMap(token => {
      console.log('Token obtained:', token.substring(0, 10) + '...');
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(authReq);
    }),
    catchError(error => {
      console.error('Error getting token:', error);
      return next(req);
    })
  );
};
