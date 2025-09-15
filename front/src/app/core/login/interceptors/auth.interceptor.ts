import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/login') || req.url.includes('/auth/logout')) {
    return next(req);
  }

  const authService: AuthService = inject(AuthService);

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
    })
  );
};
