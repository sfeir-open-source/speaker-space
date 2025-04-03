import {inject, Injectable} from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpInterceptorFn
} from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import {AuthService} from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.includes('/auth/login') || request.url.includes('/auth/logout')) {
      return next.handle(request);
    }

    return from(this.authService.getIdToken(false)).pipe(
      switchMap(() => {
        return next.handle(request);
      })
    );
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/login') || req.url.includes('/auth/logout')) {
    return next(req);
  }

  const authService = inject(AuthService);

  return from(authService.getIdToken(false)).pipe(
    switchMap(() => {
      return next(req);
    })
  );
};
