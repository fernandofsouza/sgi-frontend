import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, NgStyle, SlicePipe } from '@angular/common';
import { IndicatorService } from '../../core/services/indicator.service';
import { IndicatorSummary, REFERENCE_RANGES, getReferenceOptions, ReferenceRange } from '../../core/models/indicator.model';

interface StatCard {
  icon: string;
  label: string;
  value: number | string;
  colorClass: string;
  filter: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatSelectModule, MatFormFieldModule,
    MatProgressBarModule, MatChipsModule, MatButtonModule,
    RouterLink, FormsModule, NgClass, NgStyle, SlicePipe,
  ],
  template: `
    <div class="dashboard">
      <header class="page-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Visão geral dos indicadores do time</p>
      </header>

      <!-- ── Filtros ─────────────────────────────────────────────────────── -->
      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Ano</mat-label>
              <mat-select [(ngModel)]="filterYear" (ngModelChange)="loadIndicators()">
                @for (y of years; track y) {
                  <mat-option [value]="y">{{ y }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Periodicidade</mat-label>
              <mat-select [(ngModel)]="filterRange" (ngModelChange)="onRangeChange()">
                <mat-option value="all">Todos</mat-option>
                @for (r of referenceRanges; track r.value) {
                  <mat-option [value]="r.value">{{ r.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            @if (filterRange !== 'all') {
              <mat-form-field appearance="outline">
                <mat-label>Referência</mat-label>
                <mat-select [(ngModel)]="filterLabel" (ngModelChange)="loadIndicators()">
                  <mat-option value="all">Todos</mat-option>
                  @for (opt of refOptions(); track opt) {
                    <mat-option [value]="opt">{{ opt }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          </div>
        </mat-card-content>
      </mat-card>

      <!-- ── Stat Cards ──────────────────────────────────────────────────── -->
      <div class="stat-grid">
        @for (stat of statCards(); track stat.label) {
          <mat-card class="stat-card" [ngClass]="{ active: activeFilter() === stat.filter }"
                    (click)="toggleFilter(stat.filter)">
            <mat-card-content>
              <div class="stat-icon" [ngClass]="stat.colorClass">
                <mat-icon>{{ stat.icon }}</mat-icon>
              </div>
              <p class="stat-label">{{ stat.label }}</p>
              <p class="stat-value">{{ stat.value }}</p>
            </mat-card-content>
          </mat-card>
        }
      </div>

      <!-- ── Indicadores ─────────────────────────────────────────────────── -->
      <section>
        <h2 class="section-title">
          Indicadores
          @if (activeFilter() !== 'all') { — {{ activeFilterLabel() }} }
          ({{ filterYear }})
        </h2>

        @if (loading()) {
          <mat-progress-bar mode="indeterminate" />
        } @else if (displayIndicators().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>Nenhum indicador encontrado para este filtro.</p>
          </div>
        } @else {
          <div class="indicator-grid">
            @for (ind of displayIndicators(); track ind.id) {
              <mat-card class="indicator-card" [routerLink]="['/indicators', ind.id]">
                <mat-card-header>
                  <div mat-card-avatar class="seq-badge">#{{ ind.seqId }}</div>
                  <mat-card-title>{{ ind.title }}</mat-card-title>
                  <mat-card-subtitle>{{ ind.pdgId }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="badges">
                    <span class="badge" [ngClass]="progressClass(ind.progressStatus)">
                      {{ ind.progressStatus }}
                    </span>
                    <span class="badge badge-outline">{{ ind.creationStatus }}</span>
                  </div>
                  <div class="progress-section">
                    <div class="progress-header">
                      <span>Progresso</span>
                      <span class="progress-pct">{{ ind.progress }}%</span>
                    </div>
                    <mat-progress-bar
                      mode="determinate"
                      [value]="ind.progress"
                      [ngClass]="progressBarClass(ind.progressStatus)" />
                  </div>
                  <div class="indicator-meta">
                    <span><mat-icon class="meta-icon">people</mat-icon>{{ ind.assignees.length }}</span>
                    <span><mat-icon class="meta-icon">event_available</mat-icon>{{ ind.checkInCount }}</span>
                    <span><mat-icon class="meta-icon">calendar_today</mat-icon>{{ ind.targetDate | slice:0:10 }}</span>
                  </div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 24px; }
    .page-header h1 { font-size: 26px; font-weight: 700; margin: 0; }
    .subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px; }

    .filter-card mat-card-content { padding: 16px !important; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
    .filters mat-form-field { min-width: 130px; }

    .stat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px; }

    .stat-card { cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
    .stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
    .stat-card.active { border-color: #3b82f6; background: #eff6ff; }
    .stat-card mat-card-content { padding: 16px !important; }

    .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
    .stat-icon.blue   { background: #dbeafe; color: #3b82f6; }
    .stat-icon.green  { background: #dcfce7; color: #22c55e; }
    .stat-icon.yellow { background: #fef9c3; color: #eab308; }
    .stat-icon.red    { background: #fee2e2; color: #ef4444; }
    .stat-icon.purple { background: #f3e8ff; color: #a855f7; }
    .stat-icon.teal   { background: #ccfbf1; color: #14b8a6; }

    .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .05em; margin: 0 0 4px; }
    .stat-value { font-size: 26px; font-weight: 700; margin: 0; }

    .section-title { font-size: 18px; font-weight: 600; margin: 0 0 16px; }

    .indicator-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .indicator-card { cursor: pointer; transition: box-shadow 0.2s; }
    .indicator-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.12); }

    .seq-badge { background: #3b82f6; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }

    .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge.green  { background: #dcfce7; color: #15803d; }
    .badge.yellow { background: #fef9c3; color: #854d0e; }
    .badge.red    { background: #fee2e2; color: #991b1b; }
    .badge.gray   { background: #f1f5f9; color: #475569; }
    .badge-outline { background: transparent; border: 1px solid #e2e8f0; color: #64748b; }

    .progress-section { margin-bottom: 12px; }
    .progress-header { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px; }
    .progress-pct { font-weight: 600; color: #1e293b; }

    .indicator-meta { display: flex; gap: 16px; font-size: 12px; color: #64748b; align-items: center; }
    .meta-icon { font-size: 14px; width: 14px; height: 14px; margin-right: 4px; vertical-align: middle; }

    .empty-state { text-align: center; padding: 64px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly indicatorSvc = inject(IndicatorService);

  readonly referenceRanges = REFERENCE_RANGES;
  readonly years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - 2 + i));

  filterYear  = new Date().getFullYear();
  filterRange: ReferenceRange | 'all' = 'all';
  filterLabel = 'all';

  readonly loading    = signal(false);
  readonly indicators = signal<IndicatorSummary[]>([]);
  readonly activeFilter = signal<string>('all');

  readonly refOptions = computed(() =>
    this.filterRange !== 'all' ? getReferenceOptions(this.filterRange as ReferenceRange) : []
  );

  readonly createdIndicators = computed(() =>
    this.indicators().filter(i => i.creationStatus === 'Aprovado')
  );

  readonly statCards = computed((): StatCard[] => {
    const all = this.indicators();
    const created = this.createdIndicators();
    return [
      { icon: 'track_changes', label: 'Total',        value: all.length,    colorClass: 'blue',   filter: 'all' },
      { icon: 'check_circle',  label: 'Aprovados',    value: created.length, colorClass: 'green',  filter: 'created' },
      { icon: 'edit',          label: 'Em Edição',    value: all.filter(i => i.creationStatus !== 'Aprovado').length, colorClass: 'yellow', filter: 'inEditing' },
      { icon: 'trending_up',   label: 'Normal',       value: created.filter(i => i.progressStatus === 'Em andamento normal').length, colorClass: 'teal', filter: 'onTrack' },
      { icon: 'warning',       label: 'Em Atraso',    value: created.filter(i => i.progressStatus === 'Em andamento em atraso').length, colorClass: 'red', filter: 'atRisk' },
      { icon: 'bar_chart',     label: 'Progresso Médio',
        value: created.length
          ? Math.round(created.reduce((s, i) => s + i.progress, 0) / created.length) + '%'
          : '0%',
        colorClass: 'purple', filter: 'none' },
    ];
  });

  readonly displayIndicators = computed(() => {
    const all = this.indicators();
    const created = this.createdIndicators();
    switch (this.activeFilter()) {
      case 'created':   return created;
      case 'inEditing': return all.filter(i => i.creationStatus !== 'Aprovado');
      case 'onTrack':   return created.filter(i => i.progressStatus === 'Em andamento normal');
      case 'atRisk':    return created.filter(i => i.progressStatus === 'Em andamento em atraso');
      default:          return all;
    }
  });

  readonly activeFilterLabel = computed(() => {
    const map: Record<string, string> = {
      created: 'Aprovados', inEditing: 'Em Edição',
      onTrack: 'Normal',    atRisk: 'Em Atraso',
    };
    return map[this.activeFilter()] ?? '';
  });

  ngOnInit(): void { this.loadIndicators(); }

  loadIndicators(): void {
    this.loading.set(true);
    this.indicatorSvc.findAll({
      year:  this.filterYear,
      range: this.filterRange !== 'all' ? this.filterRange : undefined,
      label: this.filterLabel !== 'all'  ? this.filterLabel : undefined,
      size: 100,
    }).subscribe({
      next:     r => { this.indicators.set(r.content); this.loading.set(false); },
      error:    () => this.loading.set(false),
    });
  }

  onRangeChange(): void { this.filterLabel = 'all'; this.loadIndicators(); }

  toggleFilter(f: string): void {
    this.activeFilter.set(this.activeFilter() === f ? 'all' : f);
  }

  progressClass(status: string): string {
    if (status === 'Em andamento normal') return 'green';
    if (status === 'Em andamento em atraso') return 'red';
    if (status === 'Concluído') return 'teal';
    return 'gray';
  }

  progressBarClass(status: string): string {
    if (status === 'Em andamento em atraso') return 'bar-red';
    if (status === 'Concluído') return 'bar-green';
    return '';
  }
}
