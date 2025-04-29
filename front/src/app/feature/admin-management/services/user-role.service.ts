import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private roleSubject = new BehaviorSubject<string>('');
  public role$ = this.roleSubject.asObservable();

  setRole(role: string): void {
    this.roleSubject.next(role);
  }

  getRole(): Observable<string> {
    return this.role$;
  }
}
