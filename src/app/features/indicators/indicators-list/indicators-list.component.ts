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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { IndicatorService } from '../../../core/services/indicator.service';
import { IndicatorSummary } from '../../../core/models/indicator.model';

@Component({
  selector: 'app-indicators-list',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatTableModule,
    MatPaginatorModule, MatInputModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSelectModule, MatChipsModule,
    MatSnackBarModule, RouterLink, FormsModule, NgClass,
  ],
  template: `
    <div class="list-page">
      <header class="page-header">
        <div>
          <h1><mat-icon>track_changes</mat-icon> Indicadores</h1>
          <p class="subtitle">Gerenciamento de todos os indicadores</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/indicators/new">
          <mat-icon>add</mat-icon> Novo
        </a>
      </header>

      <mat-card class="filter-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Status de criação</mat-label>
              <mat-select [(ngModel)]="filterCreation" (ngModelChange)="load()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="Não iniciado">Não iniciado</mat-option>
                <mat-option value="Em edição">Em edição</mat-option>
                <mat-option value="Solicitada aprovação">Solicitada aprovação</mat-option>
                <mat-option value="Aprovado">Aprovado</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Status de progresso</mat-label>
              <mat-select [(ngModel)]="filterProgress" (ngModelChange)="load()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="Não iniciado">Não iniciado</mat-option>
                <mat-option value="Em andamento normal">Em andamento normal</mat-option>
                <mat-option value="Em andamento em atraso">Em andamento em atraso</mat-option>
                <mat-option value="Concluído">Concluído</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="indicators()" class="full-table">
            <ng-container matColumnDef="seqId">
              <th mat-header-cell *matHeaderCellDef>#</th>
              <td mat-cell *matCellDef="let i">{{ i.seqId }}</td>
            </ng-container>
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Título</th>
              <td mat-cell *matCellDef="let i">
                <a [routerLink]="['/indicators', i.id]" class="indicator-link">{{ i.title }}</a>
              </td>
            </ng-container>
            <ng-container matColumnDef="creationStatus">
              <th mat-header-cell *matHeaderCellDef>Criação</th>
              <td mat-cell *matCellDef="let i">
                <span class="badge" [ngClass]="creationClass(i.creationStatus)">{{ i.creationStatus }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="progressStatus">
              <th mat-header-cell *matHeaderCellDef>Progresso</th>
              <td mat-cell *matCellDef="let i">
                <span class="badge" [ngClass]="progressClass(i.progressStatus)">{{ i.progressStatus }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="progress">
              <th mat-header-cell *matHeaderCellDef>%</th>
              <td mat-cell *matCellDef="let i"><strong>{{ i.progress }}%</strong></td>
            </ng-container>
            <ng-container matColumnDef="targetDate">
              <th mat-header-cell *matHeaderCellDef>Prazo</th>
              <td mat-cell *matCellDef="let i">{{ i.targetDate | slice:0:10 }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let i">
                <a mat-icon-button [routerLink]="['/indicators', i.id, 'edit']">
                  <mat-icon>edit</mat-icon>
                </a>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          <mat-paginator
            [length]="totalElements()"
            [pageSize]="pageSize"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPage($event)" />
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .list-page { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-header h1 { font-size: 26px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
    .subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px; }
    .filter-card mat-card-content { padding: 16px !important; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; }
    .filters mat-form-field { min-width: 200px; }
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .full-table { width: 100%; }
    .indicator-link { color: #3b82f6; text-decoration: none; font-weight: 500; }
    .indicator-link:hover { text-decoration: underline; }
    .badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge.green  { background: #dcfce7; color: #15803d; }
    .badge.yellow { background: #fef9c3; color: #854d0e; }
    .badge.red    { background: #fee2e2; color: #991b1b; }
    .badge.gray   { background: #f1f5f9; color: #475569; }
    .badge.blue   { background: #dbeafe; color: #1d4ed8; }
  `],
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
