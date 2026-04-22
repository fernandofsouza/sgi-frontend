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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
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
