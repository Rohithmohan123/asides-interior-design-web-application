import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';

const STORAGE_KEY = 'asides.admin.session';

interface Session { token: string; username: string }

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly session = signal<Session | null>(readSession());

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly username = computed(() => this.session()?.username ?? '');
  token(): string | null { return this.session()?.token ?? null; }

  login(username: string, password: string) {
    return this.api.login(username, password).pipe(
      tap((s) => {
        this.session.set(s);
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
      })
    );
  }

  logout(redirect = true): void {
    this.session.set(null);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
    if (redirect) this.router.navigate(['/admin/login']);
  }
}

/** Adds the bearer token to admin API calls and logs out on 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const isAdminCall = req.url.startsWith('/api/admin/') && !req.url.endsWith('/admin/login');
  const token = auth.token();
  const request = isAdminCall && token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(request).pipe(
    catchError((err: unknown) => {
      if (isAdminCall && err instanceof HttpErrorResponse && err.status === 401) auth.logout();
      return throwError(() => err);
    })
  );
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/admin/login']);
};
