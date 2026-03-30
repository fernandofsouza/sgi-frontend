import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';

/**
 * Interceptor de erros HTTP.
 * Token JWT é injetado automaticamente pelo MsalInterceptor (configurado no app.config.ts).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          router.navigate(['/login']);
          break;
        case 403:
          router.navigate(['/forbidden']);
          break;
        case 404:
          console.warn(`[SGI] Recurso não encontrado: ${req.url}`);
          break;
        default:
          console.error(`[SGI] Erro HTTP ${error.status}:`, error.message);
      }
      return throwError(() => error);
    })
  );
};
