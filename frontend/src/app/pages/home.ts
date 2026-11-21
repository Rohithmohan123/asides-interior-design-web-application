import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ProjectCard } from '../shared/project-card';
import { Icon } from '../shared/icon';
import { HERO_PHOTO, STUDIO_PHOTO, photoUrl, sized } from '../core/photos';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProjectCard, Icon],
  template: `
    <section class="hero">
      <img class="hero__img" [src]="heroSrc" [srcset]="heroSrcset" sizes="100vw" alt="Bright living room with a sofa, armchair and large windows" width="1920" height="1080" fetchpriority="high" />
      <div class="wrap hero__content">
        <p class="eyebrow light">Interior design studio · Kochi</p>
        <h1>Interiors that feel calm, considered and lived-in.</h1>
        <p class="lead">Homes, kitchens and commercial spaces designed around how you actually live and work, from the first sketch to handover.</p>
        <div class="hero__cta">
          <a routerLink="/projects" class="btn btn-light">View our work <app-icon name="arrow" [size]="18" /></a>
          <a routerLink="/contact" class="btn btn-outline">Book a consultation</a>
        </div>
      </div>
      <div class="hero__facts">
        <div class="wrap facts">
          <div><strong>{{ projectCount() }}</strong><span>completed projects in the portfolio</span></div>
          <div><strong>{{ categoryCount() }}</strong><span>types of space, residential and commercial</span></div>
          <div><strong>4</strong><span>stages from consultation to handover</span></div>
        </div>
      </div>
    </section>

    <section class="section intro">
      <div class="wrap intro__grid">
        <div>
          <p class="eyebrow">The studio</p>
          <h2>We design rooms around the people who use them.</h2>
          <p class="lead">Every project starts with how you cook, work, rest and host. Layouts come first, then materials that suit Kerala’s climate, then the details that make a space feel finished.</p>
          <a routerLink="/services" class="text-link">Explore our services <app-icon name="arrow" [size]="18" /></a>
        </div>
        <img [src]="studioSrc" alt="Living room with neutral furniture and soft daylight" width="1200" height="900" loading="lazy" />
      </div>
    </section>

    <section class="section spaces-band">
      <div class="wrap">
        <div class="section-head">
          <div><p class="eyebrow">Spaces</p><h2>What we design</h2></div>
          <a routerLink="/projects" class="btn btn-ghost btn-sm">All projects <app-icon name="arrow" [size]="16" /></a>
        </div>
        <div class="spaces">
          @for (c of categories() ?? []; track c.id) {
            <a class="space" routerLink="/projects" [queryParams]="{ category: c.slug }">
              @if (coverFor(c.slug); as src) { <img [src]="src" alt="" width="800" height="1000" loading="lazy" /> }
              <span class="space__text">
                <strong>{{ c.name }}</strong>
                <small>{{ c.project_count }} project{{ c.project_count === 1 ? '' : 's' }}</small>
              </span>
            </a>
          } @empty {
            @for (i of [1,2,3,4,5,6]; track i) { <div class="skeleton" style="aspect-ratio:4/5"></div> }
          }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><p class="eyebrow">Selected work</p><h2>Featured projects</h2></div>
        </div>
        <div class="grid">
          @for (p of featured() ?? []; track p.id) { <app-project-card [project]="p" /> }
          @empty { @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:420px"></div> } }
        </div>
      </div>
    </section>

    <section class="section process">
      <div class="wrap">
        <p class="eyebrow">Process</p>
        <h2>How a project runs</h2>
        <ol class="steps">
          @for (s of steps; track s.title; let i = $index) {
            <li><span class="num">0{{ i + 1 }}</span><h3>{{ s.title }}</h3><p>{{ s.text }}</p></li>
          }
        </ol>
      </div>
    </section>
  `,
  styles: [`
    .hero { position: relative; min-height: min(92vh, 860px); display: flex; flex-direction: column; justify-content: flex-end; color: #fff; isolation: isolate; overflow: hidden; }
    .hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; animation: settle 16s ease-out both; }
    .hero::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, rgba(20, 19, 17, .72) 0%, rgba(20, 19, 17, .35) 55%, rgba(20, 19, 17, .1) 100%), linear-gradient(0deg, rgba(20, 19, 17, .55), transparent 40%); }
    @keyframes settle { from { transform: scale(1.06); } to { transform: none; } }
    .hero__content { padding-top: 120px; padding-bottom: 56px; width: 100%; }
    .hero h1 { color: #fff; max-width: 16ch; font-size: clamp(2.4rem, 5.6vw, 4.6rem); line-height: 1.02; }
    .hero .lead { color: rgba(255, 255, 255, .88); max-width: 52ch; }
    .eyebrow.light { color: #e8dccf; }
    .hero__cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 32px; }
    .btn-outline { border-color: rgba(255, 255, 255, .6); color: #fff; }
    .btn-outline:hover { background: rgba(255, 255, 255, .12); border-color: #fff; }
    .hero__facts { border-top: 1px solid rgba(255, 255, 255, .2); background: rgba(20, 19, 17, .35); backdrop-filter: blur(6px); }
    .facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .facts div { display: flex; align-items: center; gap: 14px; padding: 22px 0; }
    .facts div + div { padding-left: 28px; border-left: 1px solid rgba(255, 255, 255, .2); }
    .facts strong { font-size: 2rem; font-weight: 700; letter-spacing: -.03em; }
    .facts span { font-size: .9rem; color: rgba(255, 255, 255, .8); max-width: 20ch; line-height: 1.35; }
    .intro__grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: clamp(32px, 6vw, 96px); align-items: center; }
    .intro__grid img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; background: var(--surface-2); }
    .text-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; font-weight: 700; text-decoration: none; border-bottom: 1.5px solid var(--ink); padding-bottom: 4px; }
    .text-link:hover { color: var(--accent); border-color: var(--accent); }
    .spaces-band { background: var(--surface-2); }
    .spaces { display: grid; gap: 20px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .space { position: relative; display: block; aspect-ratio: 4 / 5; overflow: hidden; color: #fff; text-decoration: none; background: var(--stone); isolation: isolate; }
    .space img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: -2; transition: transform .7s ease; }
    .space::after { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, transparent 50%, rgba(20, 19, 17, .75)); }
    .space:hover img { transform: scale(1.05); }
    .space__text { position: absolute; left: 24px; right: 24px; bottom: 22px; display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
    .space__text strong { font-size: 1.4rem; font-weight: 700; letter-spacing: -.02em; }
    .space__text small { font-size: .85rem; opacity: .85; white-space: nowrap; }
    .process { background: var(--ink); color: #e9e5df; }
    .process h2 { color: #fff; }
    .process .eyebrow { color: #c9b39b; }
    .steps { list-style: none; padding: 0; margin: 40px 0 0; display: grid; gap: 0; grid-template-columns: repeat(4, minmax(0, 1fr)); border-top: 1px solid #3a3731; }
    .steps li { padding: 28px 28px 8px 0; }
    .steps li + li { padding-left: 28px; border-left: 1px solid #3a3731; }
    .num { display: block; font-size: .9rem; font-weight: 700; color: #c9b39b; margin-bottom: 18px; }
    .steps h3 { color: #fff; font-size: 1.25rem; }
    .steps p { color: #b8b2a9; margin: 0; }
    @media (max-width: 900px) {
      .intro__grid { grid-template-columns: minmax(0, 1fr); }
      .spaces { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .steps li:nth-child(3) { padding-left: 0; border-left: 0; }
    }
    @media (max-width: 600px) {
      .facts { grid-template-columns: minmax(0, 1fr); }
      .facts div { padding: 14px 0; }
      .facts div + div { padding-left: 0; border-left: 0; border-top: 1px solid rgba(255, 255, 255, .2); }
      .spaces { grid-template-columns: minmax(0, 1fr); }
      .space { aspect-ratio: 16 / 10; }
      .steps { grid-template-columns: minmax(0, 1fr); }
      .steps li, .steps li + li { padding: 24px 0 8px; border-left: 0; }
    }
    @media (prefers-reduced-motion: reduce) { .hero__img { animation: none; } }
  `]
})
export class HomePage {
  private readonly api = inject(ApiService);
  readonly categories = toSignal(this.api.categories());
  private readonly all = toSignal(this.api.projects());
  /** Featured projects first, topped up with the newest others to fill two rows of three. */
  readonly featured = computed(() => {
    const list = this.all();
    if (!list) return undefined;
    return [...list.filter((p) => p.featured), ...list.filter((p) => !p.featured)].slice(0, 6);
  });
  readonly projectCount = computed(() => this.all()?.length ?? '–');
  readonly categoryCount = computed(() => this.categories()?.length ?? '–');
  private readonly covers = computed(() => {
    const map = new Map<string, string>();
    for (const p of this.all() ?? []) if (p.cover_image && !map.has(p.category.slug)) map.set(p.category.slug, sized(p.cover_image, 800));
    return map;
  });
  coverFor(slug: string) { return this.covers().get(slug) ?? ''; }

  readonly heroSrc = photoUrl(HERO_PHOTO, 1920);
  readonly heroSrcset = [800, 1280, 1920, 2400].map((w) => `${photoUrl(HERO_PHOTO, w)} ${w}w`).join(', ');
  readonly studioSrc = photoUrl(STUDIO_PHOTO, 1200);
  readonly steps = [
    { title: 'Consultation', text: 'A conversation about how you use the space, your budget and your timeline.' },
    { title: 'Measure & plan', text: 'Site measurements, layout options and a first direction for materials.' },
    { title: 'Design', text: 'Final drawings, 3D views and a costed list of materials and finishes.' },
    { title: 'Execution', text: 'Coordinated work on site through to handover and snagging.' }
  ];
}
