import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Project } from '../core/models';
import { Icon } from './icon';

@Component({
  selector: 'app-project-card',
  imports: [RouterLink, Icon],
  template: `
    @let p = project();
    <a class="card project" [routerLink]="['/projects', p.slug]">
      <div class="media">
        <img [src]="p.cover_image || '/images/placeholder.svg'" [alt]="p.title + ' illustration'" loading="lazy" width="1200" height="800" />
        <span class="tag cat">{{ p.category.name }}</span>
      </div>
      <div class="body">
        <h3>{{ p.title }}</h3>
        <p class="summary">{{ p.summary }}</p>
        <div class="meta">
          <span><app-icon name="pin" [size]="16" />{{ p.location }}</span>
          @if (p.area_sqft) { <span><app-icon name="area" [size]="16" />{{ p.area_sqft }} sq ft</span> }
        </div>
      </div>
    </a>
  `,
  styles: [`
    .project { display: flex; flex-direction: column; height: 100%; overflow: hidden; text-decoration: none; transition: transform .2s, box-shadow .2s; }
    .project:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(43,36,32,.12); }
    .media { position: relative; aspect-ratio: 3 / 2; background: var(--surface-2); overflow: hidden; }
    .media img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s; }
    .project:hover .media img { transform: scale(1.03); }
    .cat { position: absolute; left: 14px; top: 14px; background: rgba(255,255,255,.92); }
    .body { padding: 20px 22px 22px; display: flex; flex-direction: column; flex: 1; }
    h3 { margin-bottom: 6px; }
    .summary { color: var(--ink-2); font-size: .95rem; flex: 1; }
    .meta { display: flex; gap: 16px; color: var(--muted); font-size: .85rem; flex-wrap: wrap; }
    .meta span { display: inline-flex; align-items: center; gap: 5px; }
  `]
})
export class ProjectCard {
  readonly project = input.required<Project>();
}
