import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Enquiry } from '../core/models';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-admin-enquiries',
  imports: [DatePipe, RouterLink, Icon],
  template: `
    <h1>Enquiries</h1>
    <div class="chips" role="group" aria-label="Filter by status" style="margin-bottom:20px">
      @for (s of filters; track s.value) {
        <button type="button" class="chip" [class.is-active]="status() === s.value" (click)="setStatus(s.value)">{{ s.label }}</button>
      }
    </div>
    <div class="list">
      @for (e of enquiries(); track e.id) {
        <article class="panel enquiry">
          <header>
            <div>
              <strong>{{ e.name }}</strong>
              <a [href]="'mailto:' + e.email" class="muted">{{ e.email }}</a>
              @if (e.phone) { <span class="muted">· {{ e.phone }}</span> }
            </div>
            <time class="muted">{{ e.created_at + 'Z' | date: 'd MMM y, HH:mm' }}</time>
          </header>
          <div class="tags">
            @if (e.project_type) { <span class="tag">{{ e.project_type }}</span> }
            @if (e.budget_range) { <span class="tag">{{ e.budget_range }}</span> }
            @if (e.project_slug) { <a class="tag" [routerLink]="['/projects', e.project_slug]" target="_blank">Re: {{ e.project_slug }}</a> }
          </div>
          <p>{{ e.message }}</p>
          <footer>
            <label>Status
              <select class="input" [value]="e.status" (change)="setEnquiryStatus(e, $any($event.target).value)">
                <option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
              </select>
            </label>
            <button type="button" class="btn btn-danger btn-sm" (click)="remove(e)"><app-icon name="trash" [size]="16" /> Delete</button>
          </footer>
        </article>
      } @empty {
        <div class="panel muted">{{ loaded() ? 'No enquiries in this view.' : 'Loading…' }}</div>
      }
    </div>
  `,
  styles: [`
    h1 { font-size: 2rem; }
    .list { display: grid; gap: 16px; }
    .enquiry header { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .enquiry header div { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
    .enquiry header a { font-size: .9rem; }
    .tags { display: flex; gap: 6px; margin: 10px 0; flex-wrap: wrap; }
    .tags a { text-decoration: none; }
    .enquiry p { white-space: pre-wrap; margin: 0 0 14px; }
    footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-top: 1px solid var(--line); padding-top: 14px; }
    footer label { display: flex; gap: 10px; align-items: center; font-size: .85rem; color: var(--muted); }
    footer .input { width: auto; padding: 6px 10px; }
  `]
})
export class AdminEnquiriesPage {
  private readonly api = inject(ApiService);
  readonly enquiries = signal<Enquiry[]>([]);
  readonly loaded = signal(false);
  readonly status = signal('');
  readonly filters = [
    { value: '', label: 'All' }, { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' }, { value: 'closed', label: 'Closed' }
  ];

  constructor() { this.load(); }

  load(): void {
    this.api.enquiries(this.status() || undefined).subscribe((l) => { this.enquiries.set(l); this.loaded.set(true); });
  }

  setStatus(s: string): void { this.status.set(s); this.load(); }

  setEnquiryStatus(e: Enquiry, status: Enquiry['status']): void {
    this.api.setEnquiryStatus(e.id, status).subscribe((updated) => {
      this.enquiries.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
    });
  }

  remove(e: Enquiry): void {
    if (!confirm(`Delete the enquiry from ${e.name}?`)) return;
    this.api.deleteEnquiry(e.id).subscribe(() => this.load());
  }
}
