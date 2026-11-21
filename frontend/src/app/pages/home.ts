import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ProjectCard } from '../shared/project-card';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProjectCard, Icon],
  template: `
    <section class="hero">
      <div class="wrap hero__grid">
        <div>
          <p class="eyebrow">Interior design studio · demo</p>
          <h1>Spaces that feel calm, considered and lived-in.</h1>
          <p class="lead">Browse sample residential and commercial interiors, see the materials behind each one, and send an enquiry that lands straight in the studio's admin area.</p>
          <div class="hero__cta">
            <a routerLink="/projects" class="btn btn-primary">View projects <app-icon name="arrow" [size]="18" /></a>
            <a routerLink="/contact" class="btn btn-ghost">Book a consultation</a>
          </div>
        </div>
        <img src="/images/hero.svg" alt="Illustration of a living room with a sofa, plant and floor lamp" width="1200" height="800" />
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <div><p class="eyebrow">Categories</p><h2>What we design</h2></div>
          <a routerLink="/projects" class="btn btn-ghost btn-sm">All projects</a>
        </div>
        <div class="cats">
          @for (c of categories() ?? []; track c.id) {
            <a class="cat card" routerLink="/projects" [queryParams]="{ category: c.slug }">
              <strong>{{ c.name }}</strong>
              <span class="muted">{{ c.description }}</span>
              <span class="count">{{ c.project_count }} project{{ c.project_count === 1 ? '' : 's' }}</span>
            </a>
          } @empty {
            @for (i of [1,2,3,4,5,6]; track i) { <div class="skeleton" style="height:130px"></div> }
          }
        </div>
      </div>
    </section>

    <section class="section featured">
      <div class="wrap">
        <div class="section-head"><div><p class="eyebrow">Featured</p><h2>Selected work</h2></div></div>
        <div class="grid">
          @for (p of featured() ?? []; track p.id) { <app-project-card [project]="p" /> }
          @empty { @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:380px"></div> } }
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <p class="eyebrow">Process</p>
        <h2>How a project runs</h2>
        <ol class="steps">
          @for (s of steps; track s.title; let i = $index) {
            <li class="panel"><span class="num">0{{ i + 1 }}</span><app-icon [name]="s.icon" [size]="26" /><h3>{{ s.title }}</h3><p class="muted">{{ s.text }}</p></li>
          }
        </ol>
      </div>
    </section>

    <section class="section--tight">
      <div class="wrap"><div class="cta panel">
        <div><h2>Planning a new space?</h2><p class="muted">Tell us about the room, your timeline and budget range.</p></div>
        <a routerLink="/contact" class="btn btn-primary">Send an enquiry</a>
      </div></div>
    </section>
  `,
  styles: [`
    .hero { padding: 56px 0 24px; }
    .hero__grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 48px; align-items: center; }
    .hero__grid img { border-radius: 22px; box-shadow: var(--shadow); }
    .hero__cta { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
    @media (max-width: 900px) { .hero__grid { grid-template-columns: 1fr; } }
    .cats { display: grid; gap: 16px; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .cat { padding: 22px; display: grid; gap: 6px; text-decoration: none; box-shadow: none; transition: border-color .15s; }
    .cat:hover { border-color: var(--accent); }
    .cat strong { font: 600 1.15rem var(--serif); }
    .cat .muted { font-size: .9rem; }
    .count { font-size: .8rem; color: var(--accent); font-weight: 600; margin-top: 6px; }
    .featured { background: var(--surface-2); }
    .steps { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .steps li { position: relative; color: var(--sage); }
    .steps h3 { color: var(--ink); margin-top: 12px; }
    .num { position: absolute; right: 20px; top: 16px; font: 600 1.6rem var(--serif); color: var(--line); }
    .cta { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; padding: 36px; background: #efe5d8; border: 0; }
    .cta h2 { margin-bottom: 4px; }
    .cta p { margin: 0; }
  `]
})
export class HomePage {
  private readonly api = inject(ApiService);
  readonly categories = toSignal(this.api.categories());
  readonly featured = toSignal(this.api.projects({ featured: true }));
  readonly steps = [
    { icon: 'sofa', title: 'Consultation', text: 'A conversation about how you use the space, your budget and timeline.' },
    { icon: 'ruler', title: 'Measure & plan', text: 'Site measurements, layout options and a first material direction.' },
    { icon: 'palette', title: 'Design', text: 'Finalised drawings, 3D views and a costed list of materials.' },
    { icon: 'hammer', title: 'Execution', text: 'Coordinated work on site through to handover and snagging.' }
  ];
}
