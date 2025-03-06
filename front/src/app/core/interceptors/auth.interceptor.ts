import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth, getIdToken } from '@angular/fire/auth';
import { from, switchMap, catchError, of } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  if (!auth.currentUser) {
    return next(req);
  }

  console.log('Adding auth token to request');
  return from(getIdToken(auth.currentUser, true)).pipe(
    switchMap(token => {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(authReq);
    }),
    catchError(error => {
      return next(req);
    })
  );
};
