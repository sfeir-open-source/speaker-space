import {inject} from '@angular/core';
import {CanActivateFn, RedirectCommand, Router} from '@angular/router';
import { Auth } from '@angular/fire/auth';
import {isDefined} from '../../../shared/type/predicates';

export const AuthGuard: CanActivateFn = () => {
  if (isDefined(inject(Auth).currentUser)) {
    return true;
  }
  return new RedirectCommand(inject(Router).parseUrl("/login"));
};
