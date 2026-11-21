import { Component, computed, inject, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { ApiService } from '../core/api.service';
import { ProjectDetail } from '../core/models';
import { ProjectCard } from '../shared/project-card';
import { EnquiryForm } from '../shared/enquiry-form';
import { Icon } from '../shared/icon';
import { sized } from '../core/photos';

type State = { status: 'loading' } | { status: 'error'; notFound: boolean } | { status: 'ok'; project: ProjectDetail };

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink, ProjectCard, EnquiryForm, Icon],
  template: `
    @switch (state().status) {
      @case ('loading') {
        <div class="wrap section"><div class="skeleton" style="height:420px"></div></div>
      }
      @case ('error') {
        <div class="wrap section">
          <h1>{{ notFound() ? 'Project not found' : 'Something went wrong' }}</h1>
          <p class="muted">{{ notFound() ? 'This project may have been removed or unpublished.' : 'The project could not be loaded.' }}</p>
          <a routerLink="/projects" class="btn btn-ghost"><app-icon name="back" [size]="18" /> Back to projects</a>
        </div>
      }
      @case ('ok') {
        @let p = project()!;
        <article>
          <section class="wrap detail-head">
            <a routerLink="/projects" class="back"><app-icon name="back" [size]="16" /> All projects</a>
            <p class="eyebrow">{{ p.category.name }}</p>
            <h1>{{ p.title }}</h1>
            <p class="lead">{{ p.summary }}</p>
            <ul class="facts">
              <li><app-icon name="pin" [size]="18" /><span><small>Location</small>{{ p.location }}</span></li>
              @if (p.area_sqft) { <li><app-icon name="area" [size]="18" /><span><small>Area</small>{{ p.area_sqft }} sq ft</span></li> }
              @if (p.year) { <li><app-icon name="calendar" [size]="18" /><span><small>Year</small>{{ p.year }}</span></li> }
              @if (p.style) { <li><app-icon name="palette" [size]="18" /><span><small>Style</small>{{ p.style }}</span></li> }
            </ul>
          </section>

          <section class="wrap gallery">
            <img class="main" [src]="activeImage()" [alt]="p.title + ', photo ' + (activeIndex() + 1)" width="1600" height="1000" />
            @if (p.gallery.length > 1) {
              <div class="thumbs" role="tablist" aria-label="Gallery">
                @for (g of p.gallery; track g; let i = $index) {
                  <button type="button" role="tab" [attr.aria-selected]="i === activeIndex()" [class.is-active]="i === activeIndex()"
                          (click)="activeIndex.set(i)" [attr.aria-label]="'Show image ' + (i + 1)">
                    <img [src]="sized(g, 400)" alt="" width="400" height="267" loading="lazy" />
                  </button>
                }
              </div>
            }
          </section>

          <section class="wrap body section--tight">
            <div>
              <h2>The brief</h2>
              <p>{{ p.description }}</p>
              @if (p.highlights.length) {
                <h3>Highlights</h3>
                <ul class="checks">@for (h of p.highlights; track h) { <li><app-icon name="check" [size]="18" />{{ h }}</li> }</ul>
              }
            </div>
            <aside class="panel">
              <h3>Materials</h3>
              <div class="chips">@for (m of p.materials; track m) { <span class="tag">{{ m }}</span> }</div>
              <hr />
              <h3>Like this project?</h3>
              <p class="muted small">Send an enquiry and mention this project.</p>
              <a href="#enquire" class="btn btn-primary btn-sm">Enquire</a>
            </aside>
          </section>

          @if (p.related.length) {
            <section class="section--tight"><div class="wrap">
              <h2>More {{ p.category.name.toLowerCase() }}</h2>
              <div class="grid">@for (r of p.related; track r.id) { <app-project-card [project]="r" /> }</div>
            </div></section>
          }

          <section id="enquire" class="section"><div class="wrap narrow">
            <h2>Enquire about a similar project</h2>
            <app-enquiry-form [projectSlug]="p.slug" />
          </div></section>
        </article>
      }
    }
  `,
  styles: [`
    .detail-head { padding-top: 40px; }
    .back { display: flex; width: max-content; align-items: center; gap: 6px; text-decoration: none; color: var(--muted); font-size: .9rem; margin-bottom: 20px; }
    .back:hover { color: var(--ink); }
    .facts { list-style: none; padding: 0; margin: 28px 0; display: flex; gap: 32px; flex-wrap: wrap; }
    .facts li { display: flex; gap: 10px; align-items: flex-start; color: var(--accent); }
    .facts span { display: grid; color: var(--ink); font-weight: 500; }
    .facts small { color: var(--muted); font-weight: 400; font-size: .78rem; text-transform: uppercase; letter-spacing: .08em; }
    .gallery .main { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: var(--surface-2); }
    .thumbs { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 160px)); gap: 12px; margin-top: 12px; }
    .thumbs button { padding: 0; border: 2px solid transparent; overflow: hidden; aspect-ratio: 3 / 2; cursor: pointer; background: var(--surface-2); opacity: .65; transition: opacity .2s, border-color .2s; }
    .thumbs button img { width: 100%; height: 100%; object-fit: cover; }
    .thumbs button.is-active, .thumbs button:hover { border-color: var(--ink); opacity: 1; }
    .body { display: grid; grid-template-columns: 1.6fr 1fr; gap: 48px; align-items: start; }
    @media (max-width: 860px) { .body { grid-template-columns: 1fr; } }
    .checks { list-style: none; padding: 0; display: grid; gap: 10px; }
    .checks li { display: flex; gap: 10px; align-items: flex-start; }
    .checks app-icon { color: var(--sage); margin-top: 3px; }
    hr { border: 0; border-top: 1px solid var(--line); margin: 22px 0; }
    .small { font-size: .9rem; }
    .narrow { max-width: 760px; }
  `]
})
export class ProjectDetailPage {
  readonly sized = sized;
  private readonly api = inject(ApiService);
  private readonly title = inject(Title);

  /** Bound from the :slug route parameter. */
  readonly slug = input.required<string>();
  readonly activeIndex = signal(0);

  readonly state = toSignal(
    toObservable(this.slug).pipe(
      tap(() => this.activeIndex.set(0)),
      switchMap((slug) => this.api.project(slug).pipe(
        map((project): State => ({ status: 'ok', project })),
        tap((s) => { if (s.status === 'ok') this.title.setTitle(`${s.project.title} · ASIDES`); }),
        catchError((err) => of<State>({ status: 'error', notFound: err?.status === 404 })),
        startWith<State>({ status: 'loading' })
      ))
    ),
    { initialValue: { status: 'loading' } as State }
  );

  readonly project = computed(() => { const s = this.state(); return s.status === 'ok' ? s.project : null; });
  readonly notFound = computed(() => { const s = this.state(); return s.status === 'error' && s.notFound; });
  readonly activeImage = computed(() => {
    const p = this.project();
    const src = p ? (p.gallery[this.activeIndex()] || p.cover_image) : '';
    return src ? sized(src, 1800) : (p ? 'images/placeholder.svg' : '');
  });
}
