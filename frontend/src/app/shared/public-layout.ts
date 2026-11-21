import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon } from './icon';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <div class="demo-bar">Independent reconstruction for portfolio purposes · all projects and content are fictional samples</div>
    <header class="header">
      <div class="wrap header__inner">
        <a routerLink="/" class="brand" (click)="open.set(false)">ASIDES<span>.in</span></a>
        <button class="menu-btn" type="button" (click)="open.set(!open())"
                [attr.aria-expanded]="open()" aria-controls="site-nav" [attr.aria-label]="open() ? 'Close menu' : 'Open menu'">
          <app-icon [name]="open() ? 'close' : 'menu'" [size]="24" />
        </button>
        <nav id="site-nav" class="nav" [class.is-open]="open()" aria-label="Main">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: item.path === '/' }"
               (click)="open.set(false)">{{ item.label }}</a>
          }
          <a routerLink="/contact" class="btn btn-primary btn-sm" (click)="open.set(false)">Start a project</a>
        </nav>
      </div>
    </header>

    <main id="main"><router-outlet /></main>

    <footer class="footer">
      <div class="wrap footer__grid">
        <div>
          <div class="brand brand--light">ASIDES<span>.in</span></div>
          <p class="muted">A demonstration interior design web application: project portfolio, enquiries and a small content management area.</p>
        </div>
        <div>
          <h3>Explore</h3>
          <a routerLink="/projects">Projects</a><a routerLink="/services">Services</a><a routerLink="/contact">Contact</a>
        </div>
        <div>
          <h3>About this demo</h3>
          <p class="muted small">Rebuilt from scratch. It is not the original production system and is not affiliated with any live ASIDES.in website. Illustrations are original artwork.</p>
          <a routerLink="/admin" class="small">Admin area</a>
        </div>
      </div>
      <div class="wrap footer__base small">© {{ year }} Demo project · MIT licence</div>
    </footer>
  `,
  styles: [`
    .skip { position: absolute; left: -999px; top: 8px; background: var(--ink); color: #fff; padding: 8px 14px; border-radius: 6px; z-index: 50; }
    .skip:focus { left: 8px; }
    .demo-bar { background: var(--ink); color: #efe7dc; font-size: .78rem; text-align: center; padding: 6px 16px; }
    .header { position: sticky; top: 0; z-index: 20; background: rgba(250, 247, 242, .92); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
    .header__inner { display: flex; align-items: center; justify-content: space-between; height: 72px; }
    .brand { font: 700 1.5rem/1 var(--serif); letter-spacing: .08em; text-decoration: none; }
    .brand span { color: var(--accent); letter-spacing: 0; font-size: .8em; }
    .brand--light { color: #fff; margin-bottom: 12px; }
    .nav { display: flex; align-items: center; gap: 28px; }
    .nav a:not(.btn) { text-decoration: none; font-weight: 500; color: var(--ink-2); padding: 6px 0; border-bottom: 2px solid transparent; }
    .nav a:not(.btn):hover, .nav a.is-active { color: var(--ink); border-color: var(--accent); }
    .menu-btn { display: none; background: none; border: 0; padding: 8px; cursor: pointer; color: var(--ink); }
    @media (max-width: 820px) {
      .menu-btn { display: inline-flex; }
      .nav { position: absolute; top: 72px; left: 0; right: 0; flex-direction: column; align-items: stretch; gap: 0;
             background: var(--bg); border-bottom: 1px solid var(--line); padding: 8px 24px 20px; display: none; }
      .nav.is-open { display: flex; }
      .nav a:not(.btn) { padding: 14px 0; border-bottom: 1px solid var(--line); }
      .nav .btn { margin-top: 16px; }
    }
    .footer { background: #231d19; color: #efe7dc; margin-top: 40px; }
    .footer__grid { display: grid; grid-template-columns: 2fr 1fr 1.5fr; gap: 40px; padding: 56px 24px 32px; }
    .footer h3 { font: 600 .8rem/1 var(--sans); text-transform: uppercase; letter-spacing: .12em; color: #b9ab9c; margin-bottom: 16px; }
    .footer a { display: block; color: #efe7dc; text-decoration: none; margin-bottom: 8px; }
    .footer a:hover { color: #fff; text-decoration: underline; }
    .footer .muted { color: #b9ab9c; }
    .footer__base { border-top: 1px solid #3a312b; padding: 18px 24px; color: #9c8f82; }
    .small { font-size: .85rem; }
    @media (max-width: 720px) { .footer__grid { grid-template-columns: 1fr; } }
  `]
})
export class PublicLayout {
  readonly open = signal(false);
  readonly year = new Date().getFullYear();
  readonly nav = [
    { path: '/', label: 'Home' },
    { path: '/projects', label: 'Projects' },
    { path: '/services', label: 'Services' },
    { path: '/contact', label: 'Contact' }
  ];
}
