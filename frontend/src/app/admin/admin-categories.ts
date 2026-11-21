import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../core/api.service';
import { Category } from '../core/models';
import { slugify } from './admin-project-form';
import { Icon } from '../shared/icon';

@Component({
  selector: 'app-admin-categories',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <h1>Categories</h1>
    <div class="layout">
      <div class="panel table-wrap">
        <table class="table">
          <thead><tr><th>Order</th><th>Name</th><th>Projects</th><th class="r">Actions</th></tr></thead>
          <tbody>
            @for (c of categories(); track c.id) {
              <tr [class.editing]="editingId() === c.id">
                <td>{{ c.sort_order }}</td>
                <td><strong>{{ c.name }}</strong><br /><small class="muted">{{ c.slug }}</small></td>
                <td>{{ c.project_count }}</td>
                <td class="r actions">
                  <button type="button" class="btn btn-ghost btn-sm" (click)="edit(c)" [attr.aria-label]="'Edit ' + c.name"><app-icon name="edit" [size]="16" /></button>
                  <button type="button" class="btn btn-danger btn-sm" (click)="remove(c)" [attr.aria-label]="'Delete ' + c.name"><app-icon name="trash" [size]="16" /></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <form class="panel form" [formGroup]="form" (ngSubmit)="save()">
        <h2>{{ editingId() ? 'Edit category' : 'Add category' }}</h2>
        <div class="field"><label for="cname">Name</label><input id="cname" class="input" formControlName="name" /></div>
        <div class="field"><label for="cslug">Slug</label><input id="cslug" class="input" formControlName="slug" (input)="slugEdited = true" /></div>
        <div class="field"><label for="cdesc">Description</label><textarea id="cdesc" class="input" rows="3" formControlName="description"></textarea></div>
        <div class="field"><label for="corder">Sort order</label><input id="corder" class="input" type="number" formControlName="sort_order" /></div>
        @if (error()) { <div class="alert alert-error" role="alert">{{ error() }}</div> }
        @if (message()) { <div class="alert alert-ok" role="status">{{ message() }}</div> }
        <div class="btns">
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid">{{ editingId() ? 'Update' : 'Add' }}</button>
          @if (editingId()) { <button type="button" class="btn btn-ghost" (click)="cancel()">Cancel</button> }
        </div>
      </form>
    </div>
  `,
  styles: [`
    h1 { font-size: 2rem; }
    h2 { font-size: 1.15rem; margin: 0; }
    .layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
    @media (max-width: 1000px) { .layout { grid-template-columns: 1fr; } }
    .r { text-align: right; }
    .actions { white-space: nowrap; }
    .actions .btn { margin-left: 6px; }
    tr.editing td { background: #fbf3ec; }
    .btns { display: flex; gap: 10px; }
  `]
})
export class AdminCategoriesPage {
  private readonly api = inject(ApiService);
  readonly categories = signal<Category[]>([]);
  readonly editingId = signal<number | null>(null);
  readonly error = signal('');
  readonly message = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    description: [''],
    sort_order: [0]
  });

  slugEdited = false;

  constructor() {
    this.load();
    this.form.controls.name.valueChanges.pipe(takeUntilDestroyed()).subscribe((name) => {
      if (!this.slugEdited && !this.editingId()) this.form.controls.slug.setValue(slugify(name ?? ''));
    });
  }

  load(): void { this.api.categories().subscribe((c) => this.categories.set(c)); }

  edit(c: Category): void {
    this.editingId.set(c.id);
    this.slugEdited = true;
    this.form.setValue({ name: c.name, slug: c.slug, description: c.description, sort_order: c.sort_order });
    this.error.set(''); this.message.set('');
  }

  cancel(): void { this.editingId.set(null); this.slugEdited = false; this.form.reset(); }

  save(): void {
    this.error.set(''); this.message.set('');
    const id = this.editingId() ?? undefined;
    this.api.saveCategory(this.form.getRawValue(), id).subscribe({
      next: (c) => { this.message.set(`${id ? 'Updated' : 'Added'} "${c.name}".`); this.cancel(); this.load(); },
      error: (e: HttpErrorResponse) => this.error.set(Object.values(e.error?.fields ?? {})[0] as string ?? e.error?.error ?? 'Save failed.')
    });
  }

  remove(c: Category): void {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    this.error.set(''); this.message.set('');
    this.api.deleteCategory(c.id).subscribe({
      next: () => { this.message.set(`Deleted "${c.name}".`); this.load(); },
      error: (e: HttpErrorResponse) => this.error.set(e.error?.error ?? 'Delete failed.')
    });
  }
}
