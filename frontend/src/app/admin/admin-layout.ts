import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <div class="admin">
      <aside class="side">
        <a routerLink="/admin" class="brand">ASIDES<span> admin</span></a>
        <nav aria-label="Admin">
          @for (l of links; track l.path) {
            <a [routerLink]="l.path" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: l.exact }">
              <app-icon [name]="l.icon" [size]="18" />{{ l.label }}
            </a>
          }
        </nav>
        <div class="side__foot">
          <a routerLink="/" target="_blank" rel="noopener"><app-icon name="external" [size]="16" /> View site</a>
          <button type="button" (click)="auth.logout()"><app-icon name="logout" [size]="16" /> Sign out ({{ auth.username() }})</button>
        </div>
      </aside>
      <main class="content"><router-outlet /></main>
    </div>
  `,
  styles: [`
    .admin { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
    .side { background: #231d19; color: #efe7dc; padding: 24px 16px; display: flex; flex-direction: column; gap: 28px; position: sticky; top: 0; height: 100vh; }
    .brand { font: 700 1.25rem/1 var(--serif); letter-spacing: .06em; text-decoration: none; padding: 0 10px; }
    .brand span { color: #d99a77; font-size: .75em; letter-spacing: .02em; }
    nav { display: grid; gap: 4px; }
    nav a, .side__foot a, .side__foot button { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 8px; color: #d6cabd; text-decoration: none; font: 500 .92rem var(--sans); background: none; border: 0; cursor: pointer; text-align: left; }
    nav a:hover, .side__foot a:hover, .side__foot button:hover { background: #342b25; color: #fff; }
    nav a.is-active { background: var(--accent); color: #fff; }
    .side__foot { margin-top: auto; display: grid; gap: 4px; }
    .content { padding: 36px 40px; min-width: 0; }
    @media (max-width: 860px) {
      .admin { grid-template-columns: 1fr; }
      .side { position: static; height: auto; gap: 14px; }
      nav { grid-template-columns: repeat(2, 1fr); }
      .content { padding: 24px 18px; }
    }
  `]
})
export class AdminLayout {
  readonly auth = inject(AuthService);
  readonly links = [
    { path: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
    { path: '/admin/projects', label: 'Projects', icon: 'sofa', exact: false },
    { path: '/admin/categories', label: 'Categories', icon: 'tag', exact: false },
    { path: '/admin/enquiries', label: 'Enquiries', icon: 'inbox', exact: false }
  ];
}
