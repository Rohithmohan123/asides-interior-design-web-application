import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Project } from '../core/models';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-admin-projects',
  imports: [RouterLink, Icon],
  template: `
    <div class="head">
      <h1>Projects</h1>
      <a routerLink="/admin/projects/new" class="btn btn-primary"><app-icon name="plus" [size]="18" /> New project</a>
    </div>
    @if (message()) { <div class="alert alert-info" role="status" style="margin-bottom:16px">{{ message() }}</div> }
    <div class="panel table-wrap">
      <table class="table">
        <thead><tr><th></th><th>Title</th><th>Category</th><th>Year</th><th>Status</th><th class="r">Actions</th></tr></thead>
        <tbody>
          @for (p of projects(); track p.id) {
            <tr>
              <td><img [src]="p.cover_image || '/images/placeholder.svg'" alt="" width="72" height="48" class="thumb" /></td>
              <td><strong>{{ p.title }}</strong><br /><small class="muted">/{{ p.slug }}</small></td>
              <td>{{ p.category.name }}</td>
              <td>{{ p.year ?? '—' }}</td>
              <td>
                <span class="tag" [class.off]="!p.published">{{ p.published ? 'Published' : 'Draft' }}</span>
                @if (p.featured) { <span class="tag feat">Featured</span> }
              </td>
              <td class="r actions">
                <a [routerLink]="['/admin/projects', p.id]" class="btn btn-ghost btn-sm" [attr.aria-label]="'Edit ' + p.title"><app-icon name="edit" [size]="16" /></a>
                <button type="button" class="btn btn-danger btn-sm" (click)="remove(p)" [attr.aria-label]="'Delete ' + p.title"><app-icon name="trash" [size]="16" /></button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="muted">{{ loaded() ? 'No projects yet.' : 'Loading…' }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 12px; flex-wrap: wrap; }
    .head h1 { margin: 0; font-size: 2rem; }
    .thumb { border-radius: 6px; object-fit: cover; }
    .r { text-align: right; }
    .actions { white-space: nowrap; }
    .actions .btn { margin-left: 6px; }
    .tag.off { background: #f4e2d8; color: var(--accent-ink); }
    .tag.feat { background: #e6ecdf; color: #4d5b3f; margin-left: 4px; }
  `]
})
export class AdminProjectsPage {
  private readonly api = inject(ApiService);
  readonly projects = signal<Project[]>([]);
  readonly loaded = signal(false);
  readonly message = signal('');

  constructor() { this.load(); }

  load(): void {
    this.api.adminProjects().subscribe((list) => { this.projects.set(list); this.loaded.set(true); });
  }

  remove(p: Project): void {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    this.api.deleteProject(p.id).subscribe(() => {
      this.message.set(`Deleted "${p.title}".`);
      this.load();
    });
  }
}
