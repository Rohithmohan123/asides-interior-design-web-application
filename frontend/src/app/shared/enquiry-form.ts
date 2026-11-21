import { Component, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ApiError } from '../core/models';

@Component({
  selector: 'app-enquiry-form',
  imports: [ReactiveFormsModule],
  template: `
    @if (sent()) {
      <div class="alert alert-ok" role="status">
        <strong>Thank you — your enquiry has been received.</strong><br />
        This is a demo: the enquiry is stored in the local database and appears in the admin area. No email is sent.
      </div>
      <button type="button" class="btn btn-ghost" style="margin-top:16px" (click)="reset()">Send another enquiry</button>
    } @else {
      <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-row">
          <div class="field">
            <label for="name">Your name *</label>
            <input id="name" class="input" formControlName="name" autocomplete="name" />
            @if (showError('name')) { <span class="error">{{ errorFor('name', 'Please enter your name.') }}</span> }
          </div>
          <div class="field">
            <label for="email">Email *</label>
            <input id="email" class="input" type="email" formControlName="email" autocomplete="email" />
            @if (showError('email')) { <span class="error">{{ errorFor('email', 'Please enter a valid email address.') }}</span> }
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="phone">Phone</label>
            <input id="phone" class="input" type="tel" formControlName="phone" autocomplete="tel" placeholder="+91 …" />
            @if (serverErrors()['phone']) { <span class="error">{{ serverErrors()['phone'] }}</span> }
          </div>
          <div class="field">
            <label for="project_type">Project type</label>
            <select id="project_type" class="input" formControlName="project_type">
              <option value="">Select…</option>
              @for (t of meta()?.projectTypes ?? []; track t) { <option [value]="t">{{ t }}</option> }
            </select>
          </div>
        </div>
        <div class="field">
          <label for="budget_range">Budget range</label>
          <select id="budget_range" class="input" formControlName="budget_range">
            <option value="">Select…</option>
            @for (b of meta()?.budgetRanges ?? []; track b) { <option [value]="b">{{ b }}</option> }
          </select>
        </div>
        <div class="field">
          <label for="message">Tell us about your space *</label>
          <textarea id="message" class="input" formControlName="message" placeholder="Room, size, what you would like to change, timeline…"></textarea>
          @if (showError('message')) { <span class="error">{{ errorFor('message', 'Please write at least 10 characters.') }}</span> }
        </div>
        <!-- Honeypot: hidden from people, often filled by bots -->
        <div class="visually-hidden" aria-hidden="true">
          <label for="website">Website</label><input id="website" tabindex="-1" formControlName="website" autocomplete="off" />
        </div>
        @if (failure()) { <div class="alert alert-error" role="alert">{{ failure() }}</div> }
        <div><button class="btn btn-primary" type="submit" [disabled]="sending()">{{ sending() ? 'Sending…' : 'Send enquiry' }}</button></div>
      </form>
    }
  `
})
export class EnquiryForm {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  /** Optional project slug when the form is shown on a project page. */
  readonly projectSlug = input<string>('');
  readonly defaultType = input<string>('');

  readonly meta = toSignal(this.api.meta());
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly failure = signal('');
  readonly serverErrors = signal<Record<string, string>>({});

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    project_type: [''],
    budget_range: [''],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(2000)]],
    website: ['']
  });

  ngOnInit(): void {
    if (this.defaultType()) this.form.controls.project_type.setValue(this.defaultType());
  }

  showError(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return (c.invalid && c.touched) || Boolean(this.serverErrors()[name]);
  }

  errorFor(name: string, fallback: string): string {
    return this.serverErrors()[name] ?? fallback;
  }

  submit(): void {
    this.failure.set('');
    this.serverErrors.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.api.sendEnquiry({ ...this.form.getRawValue(), project_slug: this.projectSlug() }).subscribe({
      next: () => { this.sending.set(false); this.sent.set(true); },
      error: (err: HttpErrorResponse) => {
        this.sending.set(false);
        const body = err.error as ApiError | null;
        if (err.status === 422 && body?.fields) this.serverErrors.set(body.fields);
        else this.failure.set(body?.error ?? 'Sorry, the enquiry could not be sent. Is the API server running?');
      }
    });
  }

  reset(): void {
    this.form.reset();
    this.sent.set(false);
  }
}
