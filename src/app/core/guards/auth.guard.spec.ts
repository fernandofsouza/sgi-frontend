import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const runGuard = () => {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['login'], {
      isAuthenticated: jasmine.createSpy('isAuthenticated'),
    });
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('deve permitir acesso quando usuário está autenticado', () => {
    (authService.isAuthenticated as jasmine.Spy).and.returnValue(true);

    const result = runGuard();

    expect(result).toBeTrue();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('deve chamar login e bloquear acesso quando não autenticado', () => {
    (authService.isAuthenticated as jasmine.Spy).and.returnValue(false);

    const result = runGuard();

    expect(result).toBeFalse();
    expect(authService.login).toHaveBeenCalled();
  });
});
