import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  it('should add withCredentials to requests', () => {
    const req = new HttpRequest('GET', '/api/test');

    const next: HttpHandlerFn = jest.fn((request) => {
      expect(request.withCredentials).toBe(true);
      return of({} as HttpEvent<unknown>);
    });

    authInterceptor(req, next);

    expect(next).toHaveBeenCalled();
  });

  it('should not modify the original request', () => {
    const req = new HttpRequest('GET', '/api/test');

    expect(req.withCredentials).toBeFalsy();

    const next: HttpHandlerFn = jest.fn((request) => {
      expect(request).not.toBe(req);
      return of({} as HttpEvent<unknown>);
    });

    authInterceptor(req, next);
  });
});
