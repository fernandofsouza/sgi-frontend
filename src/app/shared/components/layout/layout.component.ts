import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatSidenavModule, MatListModule, MatIconModule,
    MatToolbarModule, MatButtonModule, MatTooltipModule, NgClass,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">

      <!-- ── Sidebar ──────────────────────────────────────────────────── -->
      <mat-sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile() || sidenavOpen()"
        class="sidenav">

        <div class="sidenav-header">
          <div class="brand">
            <mat-icon class="brand-icon">analytics</mat-icon>
            <span class="brand-text">SGI</span>
          </div>
          <p class="brand-subtitle">Sistema de Gestão de Indicadores</p>
        </div>

        <mat-nav-list>
          @for (item of navItems; track item.path) {
            <a mat-list-item
               [routerLink]="item.path"
               routerLinkActive="nav-active"
               [matTooltip]="item.label"
               matTooltipPosition="right">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-footer">
          <div class="user-info">
            <div class="avatar">{{ userInitials() }}</div>
            <div class="user-details">
              <span class="user-name">{{ auth.user()?.name }}</span>
              <span class="user-email">{{ auth.user()?.email }}</span>
            </div>
          </div>
          <button mat-icon-button (click)="auth.logout()" matTooltip="Sair">
            <mat-icon>logout</mat-icon>
          </button>
        </div>
      </mat-sidenav>

      <!-- ── Main Content ──────────────────────────────────────────────── -->
      <mat-sidenav-content class="main-content">
        <mat-toolbar class="top-toolbar" *ngIf="isMobile()">
          <button mat-icon-button (click)="sidenavOpen.set(!sidenavOpen())">
            <mat-icon>menu</mat-icon>
          </button>
          <span>SGI</span>
        </mat-toolbar>

        <div class="content-wrapper">
          <router-outlet />
        </div>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }

    .sidenav {
      width: 260px;
      background: var(--mat-sidenav-container-color, #1e293b);
      color: white;
      display: flex;
      flex-direction: column;
    }

    .sidenav-header {
      padding: 24px 16px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon { font-size: 28px; width: 28px; height: 28px; color: #60a5fa; }
    .brand-text { font-size: 22px; font-weight: 700; letter-spacing: 1px; }
    .brand-subtitle { font-size: 10px; color: rgba(255,255,255,0.5); margin: 6px 0 0; }

    mat-nav-list { flex: 1; padding-top: 8px; }

    a[mat-list-item] { color: rgba(255,255,255,0.75); border-radius: 8px; margin: 2px 8px; }
    a[mat-list-item]:hover { background: rgba(255,255,255,0.08); color: white; }
    .nav-active { background: rgba(96,165,250,0.2) !important; color: #60a5fa !important; }

    .sidenav-footer {
      padding: 16px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: #60a5fa; color: #1e293b;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0;
    }

    .user-details { flex: 1; overflow: hidden; }
    .user-name  { display: block; font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-email { display: block; font-size: 11px; color: rgba(255,255,255,0.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .top-toolbar { background: #1e293b; color: white; }
    .main-content { background: #f8fafc; }
    .content-wrapper { padding: 32px; max-width: 1400px; margin: 0 auto; }

    @media (max-width: 768px) {
      .content-wrapper { padding: 16px; }
    }
  `],
})
export class LayoutComponent {
  readonly auth = inject(AuthService);

  readonly sidenavOpen = signal(false);
  readonly isMobile    = signal(window.innerWidth < 768);

  readonly navItems: NavItem[] = [
    { path: 'dashboard',  label: 'Dashboard',           icon: 'dashboard' },
    { path: 'indicators', label: 'Indicadores',          icon: 'track_changes' },
    { path: 'cascade',    label: 'Visão em Cascata',     icon: 'account_tree' },
    { path: 'checkins',   label: 'Check-ins',            icon: 'event_available' },
    { path: 'relevance',  label: 'Critérios Relevância', icon: 'star_rate' },
    { path: 'team',       label: 'Equipe',               icon: 'group' },
    { path: 'settings',   label: 'Configurações',        icon: 'settings' },
  ];

  userInitials(): string {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}
