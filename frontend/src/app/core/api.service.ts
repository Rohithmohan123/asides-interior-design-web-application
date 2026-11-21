import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import {
  AdminStats, Category, Enquiry, EnquiryInput, Meta, Project, ProjectDetail, ProjectInput
} from './models';

export interface ProjectQuery {
  category?: string;
  q?: string;
  featured?: boolean;
  sort?: 'newest' | 'oldest';
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api';
  private meta$?: Observable<Meta>;

  // ----- Public -----
  categories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.base}/categories`);
  }

  projects(query: ProjectQuery = {}): Observable<Project[]> {
    let params = new HttpParams();
    if (query.category) params = params.set('category', query.category);
    if (query.q) params = params.set('q', query.q);
    if (query.featured) params = params.set('featured', 'true');
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<Project[]>(`${this.base}/projects`, { params });
  }

  project(slug: string): Observable<ProjectDetail> {
    return this.http.get<ProjectDetail>(`${this.base}/projects/${encodeURIComponent(slug)}`);
  }

  meta(): Observable<Meta> {
    this.meta$ ??= this.http.get<Meta>(`${this.base}/meta`).pipe(shareReplay(1));
    return this.meta$;
  }

  sendEnquiry(input: EnquiryInput): Observable<{ ok: boolean; id?: number }> {
    return this.http.post<{ ok: boolean; id?: number }>(`${this.base}/enquiries`, input);
  }

  // ----- Admin (token added by the auth interceptor) -----
  login(username: string, password: string): Observable<{ token: string; username: string }> {
    return this.http.post<{ token: string; username: string }>(`${this.base}/admin/login`, { username, password });
  }

  stats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.base}/admin/stats`);
  }

  adminImages(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/admin/images`);
  }

  adminProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.base}/admin/projects`);
  }

  adminProject(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.base}/admin/projects/${id}`);
  }

  saveProject(input: ProjectInput, id?: number): Observable<Project> {
    return id
      ? this.http.put<Project>(`${this.base}/admin/projects/${id}`, input)
      : this.http.post<Project>(`${this.base}/admin/projects`, input);
  }

  deleteProject(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/projects/${id}`);
  }

  saveCategory(input: Partial<Category>, id?: number): Observable<Category> {
    return id
      ? this.http.put<Category>(`${this.base}/admin/categories/${id}`, input)
      : this.http.post<Category>(`${this.base}/admin/categories`, input);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/categories/${id}`);
  }

  enquiries(status?: string): Observable<Enquiry[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Enquiry[]>(`${this.base}/admin/enquiries`, { params });
  }

  setEnquiryStatus(id: number, status: Enquiry['status']): Observable<Enquiry> {
    return this.http.patch<Enquiry>(`${this.base}/admin/enquiries/${id}`, { status });
  }

  deleteEnquiry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/enquiries/${id}`);
  }
}
