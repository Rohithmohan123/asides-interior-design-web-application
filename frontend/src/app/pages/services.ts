import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-services',
  imports: [RouterLink, Icon],
  template: `
    <section class="section--tight" style="padding-top:48px">
      <div class="wrap">
        <p class="eyebrow">Services</p>
        <h1>From first sketch to handover</h1>
        <p class="lead">Whether it is one room or a whole home, every engagement follows the same careful process: plan, design, then build.</p>
      </div>
    </section>
    <section class="section--tight">
      <div class="wrap services">
        @for (s of services; track s.title) {
          <div class="panel service">
            <app-icon [name]="s.icon" [size]="28" />
            <h2>{{ s.title }}</h2>
            <p class="muted">{{ s.text }}</p>
            <ul>@for (i of s.items; track i) { <li><app-icon name="check" [size]="16" />{{ i }}</li> }</ul>
            <a routerLink="/contact" [queryParams]="{ type: s.type }" class="btn btn-ghost btn-sm">Enquire</a>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .services { display: grid; gap: 22px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .service { display: flex; flex-direction: column; color: var(--accent); }
    .service h2 { font-size: 1.4rem; color: var(--ink); margin-top: 14px; }
    .service ul { list-style: none; padding: 0; margin: 0 0 24px; display: grid; gap: 8px; color: var(--ink-2); flex: 1; }
    .service li { display: flex; gap: 8px; align-items: center; }
    .service li app-icon { color: var(--sage); }
    .service .btn { align-self: flex-start; }
  `]
})
export class ServicesPage {
  readonly services = [
    { icon: 'sofa', type: 'Full home', title: 'Full-home interiors', text: 'End-to-end design and execution for apartments and villas.',
      items: ['Space planning for every room', 'Material and finish selection', 'Custom furniture drawings', 'Site coordination'] },
    { icon: 'grid', type: 'Kitchen', title: 'Modular kitchens & wardrobes', text: 'Planned around the work triangle and your storage needs.',
      items: ['Layout and appliance planning', 'Hardware and finish options', '3D views before production', 'Installation scheduling'] },
    { icon: 'palette', type: 'Other', title: 'Design consultation', text: 'A focused session for a single room or a styling refresh.',
      items: ['Two-hour site visit', 'Mood board and colour palette', 'Shopping list with alternatives'] },
    { icon: 'tag', type: 'Commercial', title: 'Commercial spaces', text: 'Cafés, boutiques and offices that work hard every day.',
      items: ['Brand-led concept', 'Durable, compliant finishes', 'Phased execution plans'] }
  ];
}
