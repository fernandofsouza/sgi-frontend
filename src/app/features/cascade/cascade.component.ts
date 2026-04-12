import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { NgClass, NgStyle, NgTemplateOutlet } from '@angular/common';
import { IndicatorService } from '../../core/services/indicator.service';
import { IndicatorSummary } from '../../core/models/indicator.model';

interface CascadeNode extends IndicatorSummary {
  children: CascadeNode[];
  expanded: boolean;
}

@Component({
  selector: 'app-cascade',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatProgressBarModule,
    MatButtonModule, MatChipsModule, MatProgressSpinnerModule,
    RouterLink, NgClass, NgStyle, NgTemplateOutlet,
  ],
  template: `
    <div class="cascade-page">
      <header class="page-header">
        <h1><mat-icon>account_tree</mat-icon> Visão em Cascata</h1>
        <p class="subtitle">Hierarquia de indicadores vinculados</p>
      </header>

      @if (loading()) {
        <div class="loading-center">
          <mat-spinner diameter="40" />
        </div>
      } @else if (tree().length === 0) {
        <div class="empty-state">
          <mat-icon>account_tree</mat-icon>
          <p>Nenhum indicador cadastrado.</p>
          <a mat-raised-button color="primary" routerLink="/indicators/new">Criar indicador</a>
        </div>
      } @else {
        <div class="tree-container">
          @for (node of tree(); track node.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node, level: 0 }" />
          }
        </div>
      }
    </div>

    <ng-template #nodeTemplate let-node="node" let-level="level">
      <div class="node-wrapper" [ngStyle]="{ 'margin-left': level * 32 + 'px' }">
        <mat-card class="cascade-card" [routerLink]="['/indicators', node.id]">
          <mat-card-content>
            <div class="card-row">
              @if (level > 0) {
                <mat-icon class="chevron-icon">chevron_right</mat-icon>
              }
              <div class="card-body">
                <div class="card-title-row">
                  <span class="card-title">{{ node.title }}</span>
                  <span class="badge" [ngClass]="progressClass(node.progressStatus)">
                    {{ node.progressStatus }}
                  </span>
                </div>
                <mat-progress-bar mode="determinate" [value]="node.progress" class="cascade-bar" />
                <div class="card-meta">
                  <span class="progress-label">{{ node.progress }}%</span>
                  @if (node.children?.length) {
                    <span class="children-badge">
                      <mat-icon>account_tree</mat-icon> {{ node.children.length }}
                    </span>
                  }
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        @if (node.children?.length) {
          @for (child of node.children; track child.id) {
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { node: child, level: level + 1 }" />
          }
        }
      </div>
    </ng-template>
  `,
  styles: [`
    .cascade-page { display: flex; flex-direction: column; gap: 24px; }
    .page-header h1 { font-size: 26px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
    .subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px; }

    .loading-center { display: flex; justify-content: center; padding: 64px; }

    .empty-state { text-align: center; padding: 64px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }

    .tree-container { display: flex; flex-direction: column; gap: 8px; }
    .node-wrapper { display: flex; flex-direction: column; gap: 8px; }

    .cascade-card { cursor: pointer; transition: box-shadow 0.2s; margin-bottom: 0; }
    .cascade-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
    .cascade-card mat-card-content { padding: 16px !important; }

    .card-row { display: flex; align-items: flex-start; gap: 8px; }
    .chevron-icon { color: #94a3b8; flex-shrink: 0; margin-top: 2px; }
    .card-body { flex: 1; }

    .card-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .card-title { font-size: 14px; font-weight: 600; color: #1e293b; }

    .cascade-bar { margin-bottom: 8px; }

    .card-meta { display: flex; align-items: center; gap: 12px; font-size: 12px; color: #64748b; }
    .progress-label { font-weight: 600; color: #1e293b; }
    .children-badge { display: flex; align-items: center; gap: 4px; }
    .children-badge mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .badge { padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 500; }
    .badge.green  { background: #dcfce7; color: #15803d; }
    .badge.red    { background: #fee2e2; color: #991b1b; }
    .badge.teal   { background: #ccfbf1; color: #0f766e; }
    .badge.gray   { background: #f1f5f9; color: #475569; }
  `],
})
export class CascadeComponent implements OnInit {
  private readonly indicatorSvc = inject(IndicatorService);

  readonly loading = signal(false);
  readonly tree    = signal<CascadeNode[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    this.indicatorSvc.findRoots().subscribe({
      next: roots => {
        // Para cada root, busca filhos recursivamente
        const nodeRequests = roots.map(r => ({ ...r, children: [] as CascadeNode[], expanded: true }));
        this.loadChildren(nodeRequests).then(tree => {
          this.tree.set(tree);
          this.loading.set(false);
        });
      },
      error: () => this.loading.set(false),
    });
  }

  private async loadChildren(nodes: CascadeNode[]): Promise<CascadeNode[]> {
    for (const node of nodes) {
      const children = await new Promise<IndicatorSummary[]>(resolve =>
        this.indicatorSvc.findChildren(node.id).subscribe(resolve)
      );
      node.children = await this.loadChildren(
        children.map(c => ({ ...c, children: [], expanded: true }))
      );
    }
    return nodes;
  }

  progressClass(status: string): string {
    if (status === 'Em andamento normal') return 'green';
    if (status === 'Em andamento em atraso') return 'red';
    if (status === 'Concluído') return 'teal';
    return 'gray';
  }
}
