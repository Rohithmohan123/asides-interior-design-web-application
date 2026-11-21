import { Component, input } from '@angular/core';
import { EnquiryForm } from '../shared/enquiry-form';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-contact',
  imports: [EnquiryForm, Icon],
  template: `
    <section class="section" style="padding-top:48px">
      <div class="wrap contact">
        <div>
          <p class="eyebrow">Contact</p>
          <h1>Tell us about your space</h1>
          <p class="lead">Share a few details and the studio will follow up. In this demo, enquiries are saved to the local database and can be managed in the admin area.</p>
          <ul class="info">
            <li><app-icon name="mail" /> hello&#64;example.com <span class="muted">(placeholder)</span></li>
            <li><app-icon name="phone" /> +91 00000 00000 <span class="muted">(placeholder)</span></li>
            <li><app-icon name="pin" /> Kochi, Kerala</li>
          </ul>
        </div>
        <div class="panel">
          <app-enquiry-form [defaultType]="type() ?? ''" />
        </div>
      </div>
    </section>
  `,
  styles: [`
    .contact { display: grid; grid-template-columns: 1fr 1.2fr; gap: 56px; align-items: start; }
    @media (max-width: 900px) { .contact { grid-template-columns: 1fr; } }
    .info { list-style: none; padding: 0; margin: 28px 0 0; display: grid; gap: 14px; }
    .info li { display: flex; gap: 10px; align-items: center; }
    .info app-icon { color: var(--accent); }
    .panel { padding: 32px; }
  `]
})
export class ContactPage {
  /** Optional ?type= query param to preselect a project type. */
  readonly type = input<string>();
}
