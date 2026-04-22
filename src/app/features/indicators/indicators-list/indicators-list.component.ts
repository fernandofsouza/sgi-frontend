// ─── indicators-list.component.ts ────────────────────────────────────────────
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass, SlicePipe } from '@angular/common';
import { IndicatorService } from '../../../core/services/indicator.service';
import { IndicatorSummary } from '../../../core/models/indicator.model';

@Component({
  selector: 'app-indicators-list',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatPaginatorModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSelectModule, MatChipsModule,
    MatSnackBarModule, RouterLink, FormsModule, NgClass, SlicePipe,
  ],
  templateUrl: './indicators-list.component.html',
  styleUrl: './indicators-list.component.css',
})
export class IndicatorsListComponent implements OnInit {
  private readonly indicatorSvc = inject(IndicatorService);

  readonly loading       = signal(false);
  readonly indicators    = signal<IndicatorSummary[]>([]);
  readonly totalElements = signal(0);

  displayedColumns = ['seqId', 'title', 'creationStatus', 'progressStatus', 'progress', 'targetDate', 'actions'];
  filterCreation = '';
  filterProgress = '';
  pageIndex = 0;
  pageSize  = 20;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.indicatorSvc.findAll({
      creationStatus: this.filterCreation || undefined,
      progressStatus: this.filterProgress || undefined,
      page: this.pageIndex,
      size: this.pageSize,
    }).subscribe({
      next: page => {
        this.indicators.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize  = e.pageSize;
    this.load();
  }

  creationClass(s: string): string {
    if (s === 'Aprovado') return 'green';
    if (s === 'Em edição') return 'yellow';
    if (s === 'Solicitada aprovação') return 'blue';
    return 'gray';
  }

  progressClass(s: string): string {
    if (s === 'Em andamento normal') return 'green';
    if (s === 'Em andamento em atraso') return 'red';
    if (s === 'Concluído') return 'blue';
    return 'gray';
  }
}
