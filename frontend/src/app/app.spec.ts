import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';

@Component({ template: '' })
class Blank {}
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';
import { slugify } from './admin/admin-project-form';
import { ProjectCard } from './shared/project-card';
import { EnquiryForm } from './shared/enquiry-form';
import { AuthService, authInterceptor } from './core/auth';
import { Project } from './core/models';

const sampleProject: Project = {
  id: 1, slug: 'sample-room', title: 'Sample Room', category_id: 1,
  category: { id: 1, slug: 'kitchens', name: 'Kitchens' }, location: 'Kochi', area_sqft: 150, year: 2024,
  style: 'Minimal', summary: 'A short summary.', description: '', highlights: [], materials: [],
  cover_image: '', gallery: [], featured: false, published: true, created_at: '', updated_at: ''
};

function setup(imports: unknown[] = []) {
  TestBed.configureTestingModule({
    imports: imports as never[],
    providers: [provideRouter([{ path: '**', component: Blank }]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()]
  });
  return TestBed.inject(HttpTestingController);
}

describe('App shell', () => {
  it('creates the root component', () => {
    setup([App]);
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });
});

describe('slugify', () => {
  it('turns titles into URL-safe slugs', () => {
    expect(slugify('Teak & Linen Living Room')).toBe('teak-linen-living-room');
    expect(slugify('  Café   Olé!! ')).toBe('cafe-ole');
    expect(slugify('Kids’ Loft Bedroom')).toBe('kids-loft-bedroom');
  });
});

describe('ProjectCard', () => {
  it('renders title, category, location and area, with a placeholder when there is no cover', async () => {
    setup([ProjectCard]);
    const fixture = TestBed.createComponent(ProjectCard);
    fixture.componentRef.setInput('project', sampleProject);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h3')?.textContent).toContain('Sample Room');
    expect(el.textContent).toContain('Kitchens');
    expect(el.textContent).toContain('150 sq ft');
    expect(el.querySelector('a')?.getAttribute('href')).toBe('/projects/sample-room');
    expect(el.querySelector('img')?.getAttribute('src')).toBe('images/placeholder.svg');
  });
});

describe('EnquiryForm', () => {
  it('does not submit when required fields are missing', async () => {
    const http = setup([EnquiryForm]);
    const fixture = TestBed.createComponent(EnquiryForm);
    await fixture.whenStable();
    http.expectOne('/api/meta').flush({ projectTypes: ['Kitchen'], budgetRanges: [] });
    fixture.componentInstance.submit();
    await fixture.whenStable();
    http.expectNone('/api/enquiries');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Please enter your name.');
  });

  it('posts a valid enquiry and shows server-side field errors', async () => {
    const http = setup([EnquiryForm]);
    const fixture = TestBed.createComponent(EnquiryForm);
    fixture.componentRef.setInput('projectSlug', 'sample-room');
    await fixture.whenStable();
    http.expectOne('/api/meta').flush({ projectTypes: [], budgetRanges: [] });
    const form = fixture.componentInstance.form;
    form.patchValue({ name: 'Test User', email: 'test@example.com', message: 'Please call me about a kitchen.' });
    fixture.componentInstance.submit();
    const req = http.expectOne('/api/enquiries');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.project_slug).toBe('sample-room');
    req.flush({ error: 'Validation failed', fields: { phone: 'Please enter a valid phone number.' } }, { status: 422, statusText: 'Unprocessable' });
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Please enter a valid phone number.');
  });
});

describe('authInterceptor', () => {
  afterEach(() => sessionStorage.clear());

  it('adds the bearer token to admin requests only', () => {
    const http = setup();
    sessionStorage.setItem('asides.admin.session', JSON.stringify({ token: 'abc.def', username: 'admin' }));
    // AuthService reads the session when it is first created
    const client = TestBed.inject(HttpClient);
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(true);
    client.get('/api/admin/stats').subscribe();
    client.get('/api/projects').subscribe();
    expect(http.expectOne('/api/admin/stats').request.headers.get('Authorization')).toBe('Bearer abc.def');
    expect(http.expectOne('/api/projects').request.headers.has('Authorization')).toBe(false);
  });

  it('logs out when an admin request returns 401', () => {
    const http = setup();
    sessionStorage.setItem('asides.admin.session', JSON.stringify({ token: 'old', username: 'admin' }));
    const auth = TestBed.inject(AuthService);
    TestBed.inject(HttpClient).get('/api/admin/stats').subscribe({ error: () => undefined });
    http.expectOne('/api/admin/stats').flush({ error: 'Authentication required' }, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBe(false);
  });
});
