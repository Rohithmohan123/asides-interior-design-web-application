import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../core/auth';
import { DEMO_LOGIN_HINT } from '../core/demo-mode';

@Component({
  selector: 'app-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="login">
      <form class="panel form" [formGroup]="form" (ngSubmit)="submit()">
        <a routerLink="/" class="brand">ASIDES<span>.in</span></a>
        <h1>Admin sign in</h1>
        <p class="muted">Content management for projects, categories and enquiries.@if (!demoHint) { Credentials are set in <code>backend/.env</code>.}</p>
        @if (demoHint) { <div class="alert alert-info">{{ demoHint }}</div> }
        <div class="field">
          <label for="username">Username</label>
          <input id="username" class="input" formControlName="username" autocomplete="username" />
        </div>
        <div class="field">
          <label for="password">Password</label>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="current-password" />
        </div>
        @if (error()) { <div class="alert alert-error" role="alert">{{ error() }}</div> }
        <button class="btn btn-primary" type="submit" [disabled]="form.invalid || busy()">{{ busy() ? 'Signing in…' : 'Sign in' }}</button>
      </form>
    </div>
  `,
  styles: [`
    .login { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--surface-2); }
    .panel { width: 100%; max-width: 420px; padding: 36px; }
    .brand { font: 700 1.4rem/1 var(--serif); letter-spacing: .08em; text-decoration: none; }
    .brand span { color: var(--accent); }
    h1 { font-size: 1.8rem; margin: 18px 0 4px; }
    code { background: var(--surface-2); padding: 1px 6px; border-radius: 4px; font-size: .85em; }
  `]
})
export class AdminLoginPage {
  readonly demoHint = inject(DEMO_LOGIN_HINT, { optional: true });
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set('');
    const { username, password } = this.form.getRawValue();
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (err: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(err.error?.error ?? 'Sign-in failed. Is the API server running?');
      }
    });
  }
}
