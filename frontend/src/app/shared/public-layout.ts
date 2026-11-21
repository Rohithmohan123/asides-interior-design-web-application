import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Icon } from './icon';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  template: `
    <a class="skip" href="#main">Skip to content</a>
    <header class="header" [class.is-open]="open()">
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
          <a routerLink="/contact" class="btn btn-primary btn-sm" (click)="open.set(false)">Book a consultation</a>
        </nav>
      </div>
    </header>

    <main id="main"><router-outlet /></main>

    <footer class="footer">
      <div class="wrap footer__top">
        <h2>Let’s design a space you love coming home to.</h2>
        <a routerLink="/contact" class="btn btn-light">Start a project <app-icon name="arrow" [size]="18" /></a>
      </div>
      <div class="wrap footer__grid">
        <div>
          <div class="brand brand--light">ASIDES<span>.in</span></div>
          <p class="muted">Interior design and execution for homes, cafés and boutiques, based in Kochi, Kerala.</p>
        </div>
        <div>
          <h3>Studio</h3>
          <a routerLink="/projects">Projects</a><a routerLink="/services">Services</a><a routerLink="/contact">Contact</a>
        </div>
        <div>
          <h3>Spaces</h3>
          <a routerLink="/projects" [queryParams]="{ category: 'living-rooms' }">Living rooms</a>
          <a routerLink="/projects" [queryParams]="{ category: 'kitchens' }">Kitchens</a>
          <a routerLink="/projects" [queryParams]="{ category: 'commercial' }">Commercial</a>
        </div>
        <div>
          <h3>Team</h3>
          <a routerLink="/admin">Studio login</a>
        </div>
      </div>
      <div class="wrap footer__base small">
        <span>© {{ year }} ASIDES.in</span>
        <span>Portfolio rebuild by Rohith Mohan · projects are fictional samples · photos from Unsplash</span>
      </div>
    </footer>
  `,
  styles: [`
    .skip { position: absolute; left: -999px; top: 8px; background: var(--ink); color: #fff; padding: 10px 16px; z-index: 50; }
    .skip:focus { left: 8px; }
    .header { position: sticky; top: 0; z-index: 20; background: rgba(255, 255, 255, .94); backdrop-filter: saturate(1.4) blur(12px); border-bottom: 1px solid var(--line); }
    .header__inner { display: flex; align-items: center; justify-content: space-between; height: 80px; }
    .brand { font: 800 1.35rem/1 var(--sans); letter-spacing: .22em; text-decoration: none; }
    .brand span { color: var(--accent); letter-spacing: .02em; font-weight: 600; font-size: .78em; }
    .brand--light { color: #fff; margin-bottom: 16px; }
    .nav { display: flex; align-items: center; gap: 36px; }
    .nav a:not(.btn) { position: relative; text-decoration: none; font-weight: 600; font-size: .95rem; color: var(--ink-2); padding: 8px 0; }
    .nav a:not(.btn)::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 1.5px; background: var(--ink); transform: scaleX(0); transform-origin: left; transition: transform .25s; }
    .nav a:not(.btn):hover, .nav a.is-active { color: var(--ink); }
    .nav a:not(.btn):hover::after, .nav a.is-active::after { transform: scaleX(1); }
    .menu-btn { display: none; background: none; border: 0; padding: 10px; cursor: pointer; color: var(--ink); }
    @media (max-width: 860px) {
      .menu-btn { display: inline-flex; }
      .nav { position: absolute; top: 80px; left: 0; right: 0; flex-direction: column; align-items: stretch; gap: 0;
             background: #fff; border-bottom: 1px solid var(--line); padding: 8px clamp(16px, 4vw, 40px) 24px; display: none; box-shadow: var(--shadow); }
      .nav.is-open { display: flex; }
      .nav a:not(.btn) { padding: 16px 0; border-bottom: 1px solid var(--line); }
      .nav a:not(.btn)::after { display: none; }
      .nav .btn { margin-top: 18px; }
    }
    .footer { background: var(--ink); color: #e9e5df; }
    .footer__top { display: flex; justify-content: space-between; align-items: center; gap: 32px; flex-wrap: wrap; padding-top: 72px; padding-bottom: 56px; border-bottom: 1px solid #34322d; }
    .footer__top h2 { color: #fff; max-width: 20ch; margin: 0; font-size: clamp(1.7rem, 3.2vw, 2.6rem); }
    .footer__grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; padding-top: 48px; padding-bottom: 40px; }
    .footer h3 { font: 700 .85rem/1 var(--sans); color: #fff; margin-bottom: 18px; letter-spacing: 0; }
    .footer a:not(.btn) { display: block; color: #b8b2a9; text-decoration: none; margin-bottom: 10px; }
    .footer a:not(.btn):hover { color: #fff; }
    .footer .muted { color: #b8b2a9; max-width: 36ch; }
    .footer__base { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; border-top: 1px solid #34322d; padding-top: 20px; padding-bottom: 24px; color: #8f897f; }
    .small { font-size: .85rem; }
    @media (max-width: 760px) { .footer__grid { grid-template-columns: 1fr 1fr; } .footer__grid > div:first-child { grid-column: 1 / -1; } }
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
