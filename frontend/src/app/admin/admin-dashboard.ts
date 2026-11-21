import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, DatePipe],
  template: `
    <h1 class="h">Dashboard</h1>
    <div class="stats">
      @if (stats(); as s) {
        <a class="panel stat" routerLink="/admin/projects"><span>Projects</span><strong>{{ s.projects }}</strong><small>{{ s.published }} published</small></a>
        <a class="panel stat" routerLink="/admin/categories"><span>Categories</span><strong>{{ s.categories }}</strong><small>&nbsp;</small></a>
        <a class="panel stat" routerLink="/admin/enquiries"><span>New enquiries</span><strong>{{ s.newEnquiries }}</strong><small>{{ s.enquiries }} total</small></a>
      } @else {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:118px"></div> }
      }
    </div>

    <div class="panel">
      <div class="row"><h2>Latest enquiries</h2><a routerLink="/admin/enquiries" class="btn btn-ghost btn-sm">View all</a></div>
      @if (enquiries(); as list) {
        @if (list.length) {
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Received</th><th>Name</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              @for (e of list.slice(0, 5); track e.id) {
                <tr><td>{{ e.created_at + 'Z' | date: 'd MMM, HH:mm' }}</td><td>{{ e.name }}</td><td>{{ e.project_type || '—' }}</td><td><span class="tag">{{ e.status }}</span></td></tr>
              }
            </tbody>
          </table></div>
        } @else { <p class="muted">No enquiries yet. Submit one from the public contact page to see it here.</p> }
      }
    </div>
  `,
  styles: [`
    .h { font-size: 2rem; }
    .stats { display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 24px; }
    .stat { display: grid; gap: 2px; text-decoration: none; }
    .stat span { color: var(--muted); font-size: .85rem; }
    .stat strong { font: 600 2.4rem/1.1 var(--serif); }
    .stat small { color: var(--muted); }
    .row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .row h2 { font-size: 1.3rem; margin: 0; }
  `]
})
export class AdminDashboardPage {
  private readonly api = inject(ApiService);
  readonly stats = toSignal(this.api.stats());
  readonly enquiries = toSignal(this.api.enquiries());
}
