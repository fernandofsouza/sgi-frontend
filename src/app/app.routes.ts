import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  {
    path: '',
    loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'SGI — Dashboard',
      },
      {
        path: 'indicators',
        loadComponent: () => import('./features/indicators/indicators-list/indicators-list.component').then(m => m.IndicatorsListComponent),
        title: 'SGI — Indicadores',
      },
      {
        path: 'indicators/new',
        loadComponent: () => import('./features/indicators/indicator-form/indicator-form.component').then(m => m.IndicatorFormComponent),
        title: 'SGI — Novo Indicador',
      },
      {
        path: 'indicators/:id',
        loadComponent: () => import('./features/indicators/indicator-detail/indicator-detail.component').then(m => m.IndicatorDetailComponent),
        title: 'SGI — Detalhe do Indicador',
      },
      {
        path: 'indicators/:id/edit',
        loadComponent: () => import('./features/indicators/indicator-form/indicator-form.component').then(m => m.IndicatorFormComponent),
        title: 'SGI — Editar Indicador',
      },
      {
        path: 'cascade',
        loadComponent: () => import('./features/cascade/cascade.component').then(m => m.CascadeComponent),
        title: 'SGI — Visão em Cascata',
      },
      {
        path: 'checkins',
        loadComponent: () => import('./features/checkins/checkins.component').then(m => m.CheckinsComponent),
        title: 'SGI — Check-ins',
      },
      {
        path: 'relevance',
        loadComponent: () => import('./features/relevance/relevance.component').then(m => m.RelevanceComponent),
        title: 'SGI — Critérios de Relevância',
      },
      {
        path: 'team',
        loadComponent: () => import('./features/team/team.component').then(m => m.TeamComponent),
        title: 'SGI — Equipe',
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
        title: 'SGI — Configurações',
      },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
