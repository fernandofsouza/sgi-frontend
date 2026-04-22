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
  templateUrl: './cascade.component.html',
  styleUrl: './cascade.component.css',
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
