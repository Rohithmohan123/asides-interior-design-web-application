import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../core/models';
import { Icon } from './icon';
import { sized } from '../core/photos';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink, Icon],
  template: `
    @let p = project();
    <a class="card project" [routerLink]="['/projects', p.slug]">
      <div class="media">
        <img [src]="p.cover_image ? sized(p.cover_image, 900) : 'images/placeholder.svg'" [alt]="p.title" loading="lazy" width="900" height="675" />
      </div>
      <div class="body">
        <p class="kicker">{{ p.category.name }}@if (p.year) { · {{ p.year }} }</p>
        <h3>{{ p.title }} <app-icon name="arrow" [size]="18" /></h3>
        <p class="summary">{{ p.summary }}</p>
        <div class="meta">
          <span><app-icon name="pin" [size]="16" />{{ p.location }}</span>
          @if (p.area_sqft) { <span><app-icon name="area" [size]="16" />{{ p.area_sqft }} sq ft</span> }
        </div>
      </div>
    </a>
  `,
  styles: [`
    .project { display: flex; flex-direction: column; height: 100%; text-decoration: none; border: 0; background: transparent; }
    .media { position: relative; aspect-ratio: 4 / 3; background: var(--surface-2); overflow: hidden; }
    .media img { width: 100%; height: 100%; object-fit: cover; transition: transform .7s ease; }
    .project:hover .media img { transform: scale(1.05); }
    .body { padding: 18px 0 4px; display: flex; flex-direction: column; flex: 1; }
    .kicker { font-size: .8rem; font-weight: 700; color: var(--accent); margin-bottom: 6px; }
    h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 1.3rem; }
    h3 app-icon { opacity: 0; transform: translateX(-6px); transition: opacity .25s, transform .25s; }
    .project:hover h3 app-icon { opacity: 1; transform: none; }
    .summary { color: var(--ink-2); font-size: .95rem; flex: 1; }
    .meta { display: flex; gap: 16px; color: var(--muted); font-size: .85rem; flex-wrap: wrap; }
    .meta span { display: inline-flex; align-items: center; gap: 5px; }
  `]
})
export class ProjectCard {
  readonly sized = sized;
  readonly project = input.required<Project>();
}
