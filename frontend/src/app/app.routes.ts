import { Routes } from '@angular/router';
import { adminGuard } from './core/auth';
import { PublicLayout } from './shared/public-layout';

export const routes: Routes = [
  {
    path: '',
    component: PublicLayout,
    children: [
      { path: '', title: 'ASIDES · Interior design studio in Kochi', loadComponent: () => import('./pages/home').then((m) => m.HomePage) },
      { path: 'projects', title: 'Projects · ASIDES', loadComponent: () => import('./pages/projects').then((m) => m.ProjectsPage) },
      { path: 'projects/:slug', title: 'Project · ASIDES', loadComponent: () => import('./pages/project-detail').then((m) => m.ProjectDetailPage) },
      { path: 'services', title: 'Services · ASIDES', loadComponent: () => import('./pages/services').then((m) => m.ServicesPage) },
      { path: 'contact', title: 'Contact · ASIDES', loadComponent: () => import('./pages/contact').then((m) => m.ContactPage) }
    ]
  },
  { path: 'admin/login', title: 'Admin login · ASIDES', loadComponent: () => import('./admin/admin-login').then((m) => m.AdminLoginPage) },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', title: 'Dashboard · ASIDES admin', loadComponent: () => import('./admin/admin-dashboard').then((m) => m.AdminDashboardPage) },
      { path: 'projects', title: 'Projects · ASIDES admin', loadComponent: () => import('./admin/admin-projects').then((m) => m.AdminProjectsPage) },
      { path: 'projects/new', title: 'New project · ASIDES admin', loadComponent: () => import('./admin/admin-project-form').then((m) => m.AdminProjectFormPage) },
      { path: 'projects/:id', title: 'Edit project · ASIDES admin', loadComponent: () => import('./admin/admin-project-form').then((m) => m.AdminProjectFormPage) },
      { path: 'categories', title: 'Categories · ASIDES admin', loadComponent: () => import('./admin/admin-categories').then((m) => m.AdminCategoriesPage) },
      { path: 'enquiries', title: 'Enquiries · ASIDES admin', loadComponent: () => import('./admin/admin-enquiries').then((m) => m.AdminEnquiriesPage) }
    ]
  },
  { path: '**', title: 'Not found · ASIDES', loadComponent: () => import('./pages/not-found').then((m) => m.NotFoundPage) }
];
