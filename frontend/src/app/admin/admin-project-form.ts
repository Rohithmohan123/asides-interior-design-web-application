import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../core/api.service';
import { ApiError, ProjectInput } from '../core/models';
import { Icon } from '../shared/icon';

const lines = (text: string) => text.split('\n').map((s) => s.trim()).filter(Boolean);
export const slugify = (text: string) =>
  text.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

@Component({
  selector: 'app-admin-project-form',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  template: `
    <a routerLink="/admin/projects" class="back"><app-icon name="back" [size]="16" /> Projects</a>
    <h1>{{ id() ? 'Edit project' : 'New project' }}</h1>

    <form class="layout" [formGroup]="form" (ngSubmit)="save()" novalidate>
      <div class="panel form">
        <div class="field">
          <label for="title">Title *</label>
          <input id="title" class="input" formControlName="title" />
          @if (err('title')) { <span class="error">{{ err('title') }}</span> }
        </div>
        <div class="form-row">
          <div class="field">
            <label for="slug">URL slug *</label>
            <input id="slug" class="input" formControlName="slug" (input)="slugEdited = true" />
            <span class="hint">Generated from the title until you edit it. Lowercase words joined by hyphens.</span>
            @if (err('slug')) { <span class="error">{{ err('slug') }}</span> }
          </div>
          <div class="field">
            <label for="category_id">Category *</label>
            <select id="category_id" class="input" formControlName="category_id">
              <option [ngValue]="null" disabled>Select…</option>
              @for (c of categories() ?? []; track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
            @if (err('category_id')) { <span class="error">{{ err('category_id') }}</span> }
          </div>
        </div>
        <div class="form-row three">
          <div class="field"><label for="location">Location</label><input id="location" class="input" formControlName="location" /></div>
          <div class="field"><label for="area">Area (sq ft)</label><input id="area" class="input" type="number" min="1" formControlName="area_sqft" />
            @if (err('area_sqft')) { <span class="error">{{ err('area_sqft') }}</span> }</div>
          <div class="field"><label for="year">Year</label><input id="year" class="input" type="number" formControlName="year" />
            @if (err('year')) { <span class="error">{{ err('year') }}</span> }</div>
        </div>
        <div class="field"><label for="style">Style</label><input id="style" class="input" formControlName="style" placeholder="e.g. Contemporary Kerala" /></div>
        <div class="field">
          <label for="summary">Summary</label>
          <input id="summary" class="input" formControlName="summary" maxlength="300" />
          <span class="hint">{{ form.controls.summary.value.length }}/300 — shown on project cards</span>
        </div>
        <div class="field"><label for="description">Description</label><textarea id="description" class="input" formControlName="description" rows="6"></textarea></div>
        <div class="form-row">
          <div class="field"><label for="highlights">Highlights</label><textarea id="highlights" class="input" formControlName="highlights" rows="4"></textarea><span class="hint">One per line</span></div>
          <div class="field"><label for="materials">Materials</label><textarea id="materials" class="input" formControlName="materials" rows="4"></textarea><span class="hint">One per line</span></div>
        </div>
      </div>

      <div class="side">
        <div class="panel form">
          <h2>Publishing</h2>
          <label class="check"><input type="checkbox" formControlName="published" /> Published (visible on the site)</label>
          <label class="check"><input type="checkbox" formControlName="featured" /> Featured on the homepage</label>
          @if (error()) { <div class="alert alert-error" role="alert">{{ error() }}</div> }
          <button class="btn btn-primary" type="submit" [disabled]="saving()">{{ saving() ? 'Saving…' : 'Save project' }}</button>
        </div>
        <div class="panel form">
          <h2>Images</h2>
          <div class="field">
            <label for="cover">Cover image</label>
            <select id="cover" class="input" formControlName="cover_image">
              <option value="">None</option>
              @for (img of images() ?? []; track img) { <option [value]="img">{{ img.split('/').pop() }}</option> }
            </select>
            @if (err('cover_image')) { <span class="error">{{ err('cover_image') }}</span> }
          </div>
          @if (form.controls.cover_image.value) { <img [src]="form.controls.cover_image.value" alt="Cover preview" class="preview" /> }
          <div class="field">
            <label for="gallery">Gallery</label>
            <textarea id="gallery" class="input" formControlName="gallery" rows="4"></textarea>
            <span class="hint">One image path per line, e.g. /images/projects/name.svg. Add files to frontend/public/images/projects.</span>
            @if (err('gallery')) { <span class="error">{{ err('gallery') }}</span> }
          </div>
        </div>
      </div>
    </form>
  `,
  styles: [`
    .back { display: inline-flex; gap: 6px; align-items: center; color: var(--muted); text-decoration: none; font-size: .9rem; }
    h1 { font-size: 2rem; margin-top: 12px; }
    h2 { font-size: 1.15rem; margin: 0; }
    .layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
    .side { display: grid; gap: 24px; position: sticky; top: 20px; }
    .three { grid-template-columns: 2fr 1fr 1fr; }
    .preview { border-radius: 8px; border: 1px solid var(--line); }
    @media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } .side { position: static; } }
    @media (max-width: 640px) { .three { grid-template-columns: 1fr; } }
  `]
})
export class AdminProjectFormPage {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  /** Route param: numeric id when editing; undefined on /new. */
  readonly id = input<string>();

  readonly categories = toSignal(this.api.categories());
  readonly images = toSignal(this.api.adminImages());
  readonly saving = signal(false);
  readonly error = signal('');
  readonly fieldErrors = signal<Record<string, string>>({});

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    category_id: this.fb.control<number | null>(null, Validators.required),
    location: [''],
    area_sqft: this.fb.control<number | null>(null),
    year: this.fb.control<number | null>(new Date().getFullYear()),
    style: [''],
    summary: [''],
    description: [''],
    highlights: [''],
    materials: [''],
    cover_image: [''],
    gallery: [''],
    featured: [false],
    published: [true]
  });

  /** Once the admin types in the slug field we stop generating it from the title. */
  slugEdited = false;

  constructor() {
    this.form.controls.title.valueChanges.pipe(takeUntilDestroyed()).subscribe((title) => {
      if (!this.slugEdited && !this.id()) this.form.controls.slug.setValue(slugify(title));
    });
  }

  ngOnInit(): void {
    const id = Number(this.id());
    if (!id) return;
    this.slugEdited = true;
    this.api.adminProject(id).subscribe({
      next: (p) => this.form.patchValue({
        ...p,
        highlights: p.highlights.join('\n'),
        materials: p.materials.join('\n'),
        gallery: p.gallery.join('\n')
      }),
      error: () => this.error.set('Project could not be loaded.')
    });
  }

  err(name: string): string | null {
    const server = this.fieldErrors()[name];
    if (server) return server;
    const c = this.form.get(name);
    if (!c || !c.invalid || !c.touched) return null;
    if (name === 'slug' && c.hasError('pattern')) return 'Use lowercase letters, numbers and hyphens only.';
    return 'This field is required.';
  }

  save(): void {
    this.error.set('');
    this.fieldErrors.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: ProjectInput = {
      ...v,
      category_id: v.category_id!,
      highlights: lines(v.highlights),
      materials: lines(v.materials),
      gallery: lines(v.gallery)
    };
    this.saving.set(true);
    const id = Number(this.id()) || undefined;
    this.api.saveProject(payload, id).subscribe({
      next: () => this.router.navigate(['/admin/projects']),
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const body = e.error as ApiError | null;
        if (body?.fields) this.fieldErrors.set(body.fields);
        this.error.set(body?.error ?? 'Save failed.');
      }
    });
  }
}
