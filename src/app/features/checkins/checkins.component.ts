import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { IndicatorService } from '../../core/services/indicator.service';
import { CheckIn } from '../../core/models/indicator.model';

interface CheckInWithTitle extends CheckIn {
  indicatorTitle: string;
}

@Component({
  selector: 'app-checkins',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule, RouterLink, DatePipe],
  template: `
    <div class="checkins-page">
      <header class="page-header">
        <h1><mat-icon>event_available</mat-icon> Check-ins</h1>
        <p class="subtitle">Histórico de apurações e andamento</p>
      </header>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else if (checkIns().length === 0) {
        <div class="empty-state">
          <mat-icon>event_busy</mat-icon>
          <p>Nenhum check-in registrado ainda.</p>
        </div>
      } @else {
        <div class="checkin-list">
          @for (ck of checkIns(); track ck.id) {
            <mat-card class="checkin-card" [routerLink]="['/indicators', ck.indicatorId]">
              <mat-card-content>
                <div class="checkin-row">
                  <div class="avatar">{{ initials(ck.author.name) }}</div>
                  <div class="checkin-body">
                    <div class="checkin-header">
                      <span class="author-name">{{ ck.author.name }}</span>
                      <span class="sep">·</span>
                      <span class="date">{{ ck.checkDate | date:'dd/MM/yyyy' }}</span>
                      <span class="progress-badge">{{ ck.progress }}%</span>
                    </div>
                    <p class="indicator-title">{{ ck.indicatorTitle }}</p>
                    <p class="notes">{{ ck.notes }}</p>
                    @if (ck.criteriaUpdates?.length) {
                      <div class="criteria-updates">
                        @for (upd of ck.criteriaUpdates; track upd.criteriaId) {
                          <mat-chip>{{ upd.criteriaId }}: {{ upd.value }}</mat-chip>
                        }
                      </div>
                    }
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .checkins-page { display: flex; flex-direction: column; gap: 24px; }
    .page-header h1 { font-size: 26px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
    .subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px; }
    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state { text-align: center; padding: 64px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; }

    .checkin-list { display: flex; flex-direction: column; gap: 12px; }
    .checkin-card { cursor: pointer; transition: box-shadow 0.2s; }
    .checkin-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .checkin-card mat-card-content { padding: 20px !important; }

    .checkin-row { display: flex; gap: 16px; align-items: flex-start; }
    .avatar {
      width: 40px; height: 40px; border-radius: 50%; background: #3b82f6; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; flex-shrink: 0;
    }
    .checkin-body { flex: 1; }
    .checkin-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
    .author-name { font-size: 14px; font-weight: 600; }
    .sep { color: #94a3b8; }
    .date { font-size: 13px; color: #64748b; }
    .progress-badge {
      background: #eff6ff; color: #3b82f6;
      padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;
    }
    .indicator-title { font-size: 13px; color: #3b82f6; font-weight: 500; margin: 0 0 4px; }
    .notes { font-size: 14px; color: #475569; margin: 0 0 8px; }
    .criteria-updates { display: flex; gap: 8px; flex-wrap: wrap; }
  `],
})
export class CheckinsComponent implements OnInit {
  private readonly indicatorSvc = inject(IndicatorService);

  readonly loading  = signal(false);
  readonly checkIns = signal<CheckInWithTitle[]>([]);

  ngOnInit(): void {
    this.loading.set(true);
    // Carrega todos os indicadores e achata os check-ins
    this.indicatorSvc.findAll({ size: 200 }).subscribe({
      next: page => {
        const allCheckIns: CheckInWithTitle[] = [];
        page.content.forEach(ind => {
          // O detail tem checkIns; aqui usamos o summary para listar
          // (em produção, o backend pode oferecer endpoint /checkins global)
          allCheckIns.push(...([] as CheckIn[]).map(ck => ({ ...ck, indicatorTitle: ind.title })));
        });
        this.checkIns.set(allCheckIns.sort((a, b) => b.checkDate.localeCompare(a.checkDate)));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}
