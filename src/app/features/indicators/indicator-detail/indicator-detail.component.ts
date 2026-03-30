import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe, NgClass, PercentPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IndicatorService } from '../../../core/services/indicator.service';
import { TeamMemberService } from '../../../core/services/team-member.service';
import { IndicatorDetail, CheckIn, TeamMember } from '../../../core/models/indicator.model';

@Component({
  selector: 'app-indicator-detail',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressBarModule,
    MatChipsModule, MatTabsModule, MatDividerModule, MatDialogModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTableModule,
    MatTooltipModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    DatePipe, NgClass, ReactiveFormsModule, RouterLink,
  ],
  template: `
    <div class="detail-page">

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="48" /></div>
      } @else if (indicator()) {

        <!-- ── Header ──────────────────────────────────────────────────── -->
        <div class="detail-header">
          <div class="header-left">
            <button mat-icon-button routerLink="/indicators" matTooltip="Voltar">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div>
              <div class="seq-title">
                <span class="seq">#{{ indicator()!.seqId }}</span>
                <h1>{{ indicator()!.title }}</h1>
              </div>
              <div class="header-badges">
                <span class="badge" [ngClass]="creationClass(indicator()!.creationStatus)">
                  {{ indicator()!.creationStatus }}
                </span>
                <span class="badge" [ngClass]="progressClass(indicator()!.progressStatus)">
                  {{ indicator()!.progressStatus }}
                </span>
                @if (indicator()!.pdgId) {
                  <span class="badge badge-outline">{{ indicator()!.pdgId }}</span>
                }
              </div>
            </div>
          </div>
          <div class="header-actions">
            <a mat-stroked-button [routerLink]="['/indicators', indicator()!.id, 'edit']">
              <mat-icon>edit</mat-icon> Editar
            </a>
          </div>
        </div>

        <!-- ── Progresso Global ────────────────────────────────────────── -->
        <mat-card class="progress-card">
          <mat-card-content>
            <div class="progress-row">
              <div class="progress-info">
                <span class="progress-label">Progresso geral</span>
                <span class="progress-value">{{ indicator()!.progress }}%</span>
              </div>
              <mat-progress-bar mode="determinate" [value]="indicator()!.progress"
                                [ngClass]="progressBarClass(indicator()!.progressStatus)" />
            </div>
            <div class="meta-row">
              <span><mat-icon class="meta-icon">calendar_today</mat-icon>
                Prazo: {{ indicator()!.targetDate | date:'dd/MM/yyyy' }}</span>
              <span><mat-icon class="meta-icon">date_range</mat-icon>
                {{ indicator()!.referenceYear }} · {{ indicator()!.referenceLabel }}</span>
              @if (indicator()!.parentId) {
                <a [routerLink]="['/indicators', indicator()!.parentId]" class="parent-link">
                  <mat-icon class="meta-icon">account_tree</mat-icon> Indicador pai
                </a>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <!-- ── Tabs ────────────────────────────────────────────────────── -->
        <mat-tab-group animationDuration="200ms">

          <!-- Tab: Visão Geral -->
          <mat-tab label="Visão Geral">
            <div class="tab-content">
              <div class="two-col">

                <mat-card>
                  <mat-card-header><mat-card-title>Descrição</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <p class="description">{{ indicator()!.description || 'Sem descrição.' }}</p>
                    @if (indicator()!.observation) {
                      <mat-divider />
                      <p class="observation"><mat-icon>info</mat-icon> {{ indicator()!.observation }}</p>
                    }
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header><mat-card-title>Responsáveis</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="member-list">
                      @for (m of indicator()!.assignees; track m.id) {
                        <div class="member-item">
                          <div class="avatar sm">{{ initials(m.name) }}</div>
                          <div>
                            <span class="member-name">{{ m.name }}</span>
                            <span class="member-role">{{ m.role }}</span>
                          </div>
                        </div>
                      }
                    </div>
                    @if (indicator()!.editor) {
                      <mat-divider />
                      <div class="role-row">
                        <span class="role-label">Editor:</span>
                        <span>{{ indicator()!.editor!.name }}</span>
                      </div>
                    }
                    @if (indicator()!.validator) {
                      <div class="role-row">
                        <span class="role-label">Validador:</span>
                        <span>{{ indicator()!.validator!.name }}</span>
                      </div>
                    }
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Critérios de Avaliação -->
              <mat-card>
                <mat-card-header><mat-card-title>Critérios de Avaliação</mat-card-title></mat-card-header>
                <mat-card-content>
                  <table mat-table [dataSource]="indicator()!.criteria" class="full-table">
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Critério</th>
                      <td mat-cell *matCellDef="let c">{{ c.name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="weight">
                      <th mat-header-cell *matHeaderCellDef>Peso</th>
                      <td mat-cell *matCellDef="let c">{{ c.weight }}%</td>
                    </ng-container>
                    <ng-container matColumnDef="current">
                      <th mat-header-cell *matHeaderCellDef>Atual</th>
                      <td mat-cell *matCellDef="let c">{{ c.currentValue }} {{ c.unit }}</td>
                    </ng-container>
                    <ng-container matColumnDef="target">
                      <th mat-header-cell *matHeaderCellDef>Meta</th>
                      <td mat-cell *matCellDef="let c">{{ c.targetValue }} {{ c.unit }}</td>
                    </ng-container>
                    <ng-container matColumnDef="progress">
                      <th mat-header-cell *matHeaderCellDef>Progresso</th>
                      <td mat-cell *matCellDef="let c">
                        <mat-progress-bar mode="determinate"
                          [value]="criteriaProgress(c.currentValue, c.targetValue)" />
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="criteriaCols"></tr>
                    <tr mat-row *matRowDef="let row; columns: criteriaCols;"></tr>
                  </table>
                </mat-card-content>
              </mat-card>

              <!-- Indicadores filhos -->
              @if (indicator()!.childrenIds.length > 0) {
                <mat-card>
                  <mat-card-header><mat-card-title>Indicadores Vinculados</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="children-list">
                      @for (childId of indicator()!.childrenIds; track childId) {
                        <a mat-stroked-button [routerLink]="['/indicators', childId]">
                          <mat-icon>chevron_right</mat-icon> {{ childId }}
                        </a>
                      }
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            </div>
          </mat-tab>

          <!-- Tab: Check-ins -->
          <mat-tab [label]="'Check-ins (' + indicator()!.checkIns.length + ')'">
            <div class="tab-content">

              <!-- Formulário novo check-in -->
              <mat-card class="checkin-form-card">
                <mat-card-header><mat-card-title>Registrar Check-in</mat-card-title></mat-card-header>
                <mat-card-content>
                  <form [formGroup]="checkInForm" (ngSubmit)="submitCheckIn()" class="checkin-form">
                    <mat-form-field appearance="outline">
                      <mat-label>Progresso (%)</mat-label>
                      <input matInput type="number" min="0" max="100" formControlName="progress" />
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Data</mat-label>
                      <input matInput type="date" formControlName="checkDate" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Observações</mat-label>
                      <textarea matInput rows="3" formControlName="notes"></textarea>
                    </mat-form-field>

                    <mat-form-field appearance="outline">
                      <mat-label>Autor</mat-label>
                      <mat-select formControlName="authorId">
                        @for (m of members(); track m.id) {
                          <mat-option [value]="m.id">{{ m.name }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>

                    <button mat-raised-button color="primary" type="submit"
                            [disabled]="checkInForm.invalid || savingCheckIn()">
                      <mat-icon>add</mat-icon> Registrar
                    </button>
                  </form>
                </mat-card-content>
              </mat-card>

              <!-- Histórico de check-ins -->
              <div class="checkin-history">
                @for (ck of indicator()!.checkIns; track ck.id) {
                  <mat-card class="checkin-card">
                    <mat-card-content>
                      <div class="checkin-row">
                        <div class="avatar">{{ initials(ck.author.name) }}</div>
                        <div class="checkin-body">
                          <div class="checkin-header">
                            <strong>{{ ck.author.name }}</strong>
                            <span class="sep">·</span>
                            <span>{{ ck.checkDate | date:'dd/MM/yyyy' }}</span>
                            <span class="progress-badge">{{ ck.progress }}%</span>
                          </div>
                          <p class="notes">{{ ck.notes }}</p>
                        </div>
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
                @if (indicator()!.checkIns.length === 0) {
                  <p class="empty-hint">Nenhum check-in registrado ainda.</p>
                }
              </div>
            </div>
          </mat-tab>

          <!-- Tab: Escala de Conquista -->
          <mat-tab label="Escala de Conquista">
            <div class="tab-content">
              <mat-card>
                <mat-card-content>
                  <div class="scale-list">
                    @for (s of indicator()!.achievementScale; track s.value) {
                      <div class="scale-item">
                        <div class="scale-value">{{ s.value }}</div>
                        <div class="scale-label">{{ s.label }}</div>
                      </div>
                    }
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .detail-page { display: flex; flex-direction: column; gap: 20px; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
    .header-left { display: flex; align-items: flex-start; gap: 12px; }
    .seq-title { display: flex; align-items: center; gap: 10px; }
    .seq { background: #3b82f6; color: white; border-radius: 8px; padding: 2px 10px; font-size: 13px; font-weight: 700; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
    .header-badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .header-actions { display: flex; gap: 8px; flex-shrink: 0; }

    .progress-card mat-card-content { padding: 20px !important; }
    .progress-row { margin-bottom: 12px; }
    .progress-info { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .progress-label { color: #64748b; font-size: 14px; }
    .progress-value { font-weight: 700; font-size: 18px; }
    .meta-row { display: flex; gap: 20px; font-size: 13px; color: #64748b; flex-wrap: wrap; }
    .meta-icon { font-size: 15px; width: 15px; height: 15px; margin-right: 4px; vertical-align: middle; }
    .parent-link { color: #3b82f6; text-decoration: none; display: flex; align-items: center; }

    .tab-content { display: flex; flex-direction: column; gap: 16px; padding: 20px 0; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

    mat-card-content { padding: 16px !important; }
    .description { color: #475569; line-height: 1.6; margin: 0; }
    .observation { display: flex; align-items: flex-start; gap: 8px; color: #64748b; font-size: 13px; margin: 12px 0 0; }

    .member-list { display: flex; flex-direction: column; gap: 12px; }
    .member-item { display: flex; align-items: center; gap: 10px; }
    mat-divider { margin: 12px 0 !important; }
    .role-row { display: flex; gap: 8px; font-size: 13px; margin-top: 6px; }
    .role-label { color: #64748b; }

    .full-table { width: 100%; }

    .avatar { width: 40px; height: 40px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; flex-shrink: 0; }
    .avatar.sm { width: 32px; height: 32px; font-size: 11px; }
    .member-name { display: block; font-size: 14px; font-weight: 600; }
    .member-role { display: block; font-size: 12px; color: #64748b; }

    .checkin-form-card mat-card-content { padding: 16px !important; }
    .checkin-form { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; }
    .checkin-form mat-form-field { min-width: 160px; }
    .full-width { flex: 1 1 100%; }

    .checkin-history { display: flex; flex-direction: column; gap: 10px; }
    .checkin-card mat-card-content { padding: 16px !important; }
    .checkin-row { display: flex; gap: 12px; }
    .checkin-body { flex: 1; }
    .checkin-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 14px; }
    .sep { color: #cbd5e1; }
    .progress-badge { background: #eff6ff; color: #3b82f6; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .notes { font-size: 13px; color: #475569; margin: 0; }
    .empty-hint { text-align: center; color: #94a3b8; padding: 32px; }

    .scale-list { display: flex; flex-direction: column; gap: 12px; }
    .scale-item { display: flex; align-items: center; gap: 16px; padding: 12px; border-radius: 8px; background: #f8fafc; }
    .scale-value { width: 36px; height: 36px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .scale-label { font-size: 15px; }

    .children-list { display: flex; gap: 8px; flex-wrap: wrap; }

    .badge { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .badge.green  { background: #dcfce7; color: #15803d; }
    .badge.yellow { background: #fef9c3; color: #854d0e; }
    .badge.red    { background: #fee2e2; color: #991b1b; }
    .badge.blue   { background: #dbeafe; color: #1d4ed8; }
    .badge.gray   { background: #f1f5f9; color: #475569; }
    .badge-outline { background: transparent; border: 1px solid #e2e8f0; color: #64748b; }

    .bar-red .mdc-linear-progress__bar-inner   { border-color: #ef4444 !important; }
    .bar-green .mdc-linear-progress__bar-inner { border-color: #22c55e !important; }
  `],
})
export class IndicatorDetailComponent implements OnInit {
  private readonly route         = inject(ActivatedRoute);
  private readonly indicatorSvc  = inject(IndicatorService);
  private readonly teamSvc       = inject(TeamMemberService);
  private readonly snack         = inject(MatSnackBar);
  private readonly fb            = inject(FormBuilder);

  readonly loading       = signal(true);
  readonly savingCheckIn = signal(false);
  readonly indicator     = signal<IndicatorDetail | null>(null);
  readonly members       = signal<TeamMember[]>([]);

  readonly criteriaCols = ['name', 'weight', 'current', 'target', 'progress'];

  readonly checkInForm = this.fb.group({
    progress:  [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    checkDate: [new Date().toISOString().substring(0, 10), Validators.required],
    notes:     [''],
    authorId:  ['', Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.indicatorSvc.findById(id).subscribe({
      next: ind => { this.indicator.set(ind); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.teamSvc.findAll().subscribe(m => this.members.set(m));
  }

  submitCheckIn(): void {
    if (this.checkInForm.invalid) return;
    this.savingCheckIn.set(true);
    const id = this.indicator()!.id;
    this.indicatorSvc.addCheckIn(id, this.checkInForm.value as any).subscribe({
      next: () => {
        this.snack.open('Check-in registrado!', '', { duration: 2500 });
        this.indicatorSvc.findById(id).subscribe(ind => this.indicator.set(ind));
        this.checkInForm.reset({ progress: 0, checkDate: new Date().toISOString().substring(0, 10) });
        this.savingCheckIn.set(false);
      },
      error: () => this.savingCheckIn.set(false),
    });
  }

  criteriaProgress(current: number, target: number): number {
    if (!target) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
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

  progressBarClass(s: string): string {
    if (s === 'Em andamento em atraso') return 'bar-red';
    if (s === 'Concluído') return 'bar-green';
    return '';
  }
}
