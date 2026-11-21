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
          <p class="lead">Share a few details about the room, your timeline and budget. The studio reviews every enquiry and follows up to arrange a consultation.</p>
          <ul class="info">
            <li><app-icon name="pin" /><span><strong>Studio</strong>Kochi, Kerala</span></li>
            <li><app-icon name="calendar" /><span><strong>Consultations</strong>By appointment, in studio or on site</span></li>
            <li><app-icon name="mail" /><span><strong>Response</strong>Replies are sent to the email you provide</span></li>
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
    .info li { display: flex; gap: 14px; align-items: flex-start; }
    .info span { display: grid; color: var(--ink-2); }
    .info strong { color: var(--ink); }
    .info app-icon { color: var(--accent); }
    .panel { padding: 32px; }
  `]
})
export class ContactPage {
  /** Optional ?type= query param to preselect a project type. */
  readonly type = input<string>();
}
