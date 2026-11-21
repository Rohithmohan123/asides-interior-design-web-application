import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { Project } from '../core/models';
import { ProjectCard } from '../shared/project-card';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-projects',
  imports: [ProjectCard, ReactiveFormsModule, Icon],
  template: `
    <section class="section--tight page-head">
      <div class="wrap">
        <p class="eyebrow">Portfolio</p>
        <h1>Projects</h1>
        <p class="lead">Residential and commercial interiors, grouped by space. Filter by category or search by name, location or style.</p>
      </div>
    </section>

    <section class="section--tight">
      <div class="wrap">
        <div class="toolbar">
          <div class="chips" role="group" aria-label="Filter by category">
            <button type="button" class="chip" [class.is-active]="!category()" (click)="setCategory('')">All</button>
            @for (c of categories() ?? []; track c.id) {
              <button type="button" class="chip" [class.is-active]="category() === c.slug" (click)="setCategory(c.slug)">{{ c.name }}</button>
            }
          </div>
          <div class="search-row">
            <label class="search">
              <app-icon name="search" [size]="18" />
              <span class="visually-hidden">Search projects</span>
              <input type="search" class="input" placeholder="Search projects…" [formControl]="search" />
            </label>
            <label class="visually-hidden" for="sort">Sort</label>
            <select id="sort" class="input sort" [formControl]="sort">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <p class="muted count" aria-live="polite">
          @if (loading()) { Loading… } @else { {{ projects().length }} project{{ projects().length === 1 ? '' : 's' }} }
        </p>

        @if (error()) {
          <div class="alert alert-error">Projects could not be loaded. Make sure the API server is running on port 3000.</div>
        }
        <div class="grid">
          @for (p of projects(); track p.id) { <app-project-card [project]="p" /> }
          @empty {
            @if (!loading() && !error()) {
              <div class="panel empty">No projects match your filters. <button type="button" class="btn btn-ghost btn-sm" (click)="clear()">Clear filters</button></div>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-head { padding-top: 48px; }
    .toolbar { display: flex; flex-direction: column; gap: 16px; margin-bottom: 8px; }
    .search-row { display: flex; gap: 12px; flex-wrap: wrap; }
    .search { position: relative; flex: 1; min-width: 220px; max-width: 420px; color: var(--muted); }
    .search app-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); }
    .search .input { padding-left: 42px; }
    .sort { width: auto; }
    .count { margin: 12px 0 20px; font-size: .9rem; }
    .empty { grid-column: 1 / -1; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  `]
})
export class ProjectsPage {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = toSignal(this.api.categories());
  readonly category = signal('');
  readonly projects = signal<Project[]>([]);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly search = new FormControl('', { nonNullable: true });
  readonly sort = new FormControl<'newest' | 'oldest'>('newest', { nonNullable: true });

  constructor() {
    const destroyRef = inject(DestroyRef);

    // URL query params are the single source of truth for filters.
    this.route.queryParamMap.pipe(
      map((p) => ({ category: p.get('category') ?? '', q: p.get('q') ?? '', sort: (p.get('sort') === 'oldest' ? 'oldest' : 'newest') as 'newest' | 'oldest' })),
      tap((f) => {
        this.category.set(f.category);
        if (this.search.value !== f.q) this.search.setValue(f.q, { emitEvent: false });
        if (this.sort.value !== f.sort) this.sort.setValue(f.sort, { emitEvent: false });
        this.loading.set(true);
        this.error.set(false);
      }),
      switchMap((f) => this.api.projects({ category: f.category || undefined, q: f.q || undefined, sort: f.sort }).pipe(
        catchError(() => { this.error.set(true); return of([] as Project[]); })
      )),
      takeUntilDestroyed(destroyRef)
    ).subscribe((list) => { this.projects.set(list); this.loading.set(false); });

    this.search.valueChanges.pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed(destroyRef))
      .subscribe((q) => this.update({ q: q.trim() || null }));
    this.sort.valueChanges.pipe(takeUntilDestroyed(destroyRef))
      .subscribe((s) => this.update({ sort: s === 'newest' ? null : s }));
  }

  setCategory(slug: string): void { this.update({ category: slug || null }); }
  clear(): void { this.router.navigate([], { queryParams: {} }); }

  private update(params: Record<string, string | null>): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }
}
