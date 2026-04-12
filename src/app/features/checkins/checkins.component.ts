import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { IndicatorService } from '../../core/services/indicator.service';
import { TeamMemberService } from '../../core/services/team-member.service';
import { CheckIn, IndicatorSummary, TeamMember } from '../../core/models/indicator.model';

interface CheckInWithTitle extends CheckIn {
  indicatorTitle: string;
}

@Component({
  selector: 'app-checkin-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatProgressSpinnerModule, ReactiveFormsModule,
  ],
  template: `
    <h2 mat-dialog-title>Novo Check-in</h2>
    <mat-dialog-content>
      @if (loadingData()) {
        <div style="display:flex;justify-content:center;padding:32px"><mat-spinner diameter="32"/></div>
      } @else {
        <form [formGroup]="form" class="checkin-form">
          <mat-form-field appearance="outline">
            <mat-label>Indicador</mat-label>
            <mat-select formControlName="indicatorId">
              @for (ind of indicators(); track ind.id) {
                <mat-option [value]="ind.id">{{ ind.title }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Autor</mat-label>
            <mat-select formControlName="authorId">
              @for (m of members(); track m.id) {
                <mat-option [value]="m.id">{{ m.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Data da apuração</mat-label>
            <input matInput type="date" formControlName="checkDate" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Progresso (%)</mat-label>
            <input matInput type="number" min="0" max="100" formControlName="progress" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Observações</mat-label>
            <textarea matInput rows="3" formControlName="notes"></textarea>
          </mat-form-field>
        </form>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary"
              [disabled]="form.invalid || loadingData()"
              (click)="save()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: [`.checkin-form { display: flex; flex-direction: column; gap: 8px; min-width: 380px; padding-top: 8px; }`],
})
export class CheckinDialogComponent implements OnInit {
  private readonly indicatorSvc = inject(IndicatorService);
  private readonly teamSvc      = inject(TeamMemberService);
  readonly dialogRef = inject(MatDialogRef<CheckinDialogComponent>);

  readonly loadingData = signal(true);
  readonly indicators  = signal<IndicatorSummary[]>([]);
  readonly members     = signal<TeamMember[]>([]);

  readonly form = inject(FormBuilder).group({
    indicatorId: ['', Validators.required],
    authorId:    ['', Validators.required],
    checkDate:   [new Date().toISOString().substring(0, 10), Validators.required],
    progress:    [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    notes:       [''],
  });

  ngOnInit(): void {
    forkJoin({
      page:    this.indicatorSvc.findAll({ size: 200 }),
      members: this.teamSvc.findAll(),
    }).subscribe({
      next: ({ page, members }) => {
        this.indicators.set(page.content);
        this.members.set(members);
        this.loadingData.set(false);
      },
      error: () => this.loadingData.set(false),
    });
  }

  save(): void { this.dialogRef.close(this.form.value); }
}

@Component({
  selector: 'app-checkins',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule,
    MatChipsModule, MatDialogModule, MatSnackBarModule, RouterLink, DatePipe,
  ],
  template: `
    <div class="checkins-page">
      <header class="page-header">
        <div>
          <h1><mat-icon>event_available</mat-icon> Check-ins</h1>
          <p class="subtitle">Histórico de apurações e andamento</p>
        </div>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>add</mat-icon> Novo Check-in
        </button>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
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
  private readonly dialog  = inject(MatDialog);
  private readonly snack   = inject(MatSnackBar);

  readonly loading  = signal(false);
  readonly checkIns = signal<CheckInWithTitle[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.indicatorSvc.findAll({ size: 200 }).subscribe({
      next: page => {
        const withCheckIns = page.content.filter(ind => ind.checkInCount > 0);
        if (withCheckIns.length === 0) {
          this.checkIns.set([]);
          this.loading.set(false);
          return;
        }
        forkJoin(
          withCheckIns.map(ind =>
            this.indicatorSvc.listCheckIns(ind.id).pipe(
              map(cks => cks.map(ck => ({ ...ck, indicatorTitle: ind.title })))
            )
          )
        ).subscribe({
          next: results => {
            const all: CheckInWithTitle[] = results.flat();
            this.checkIns.set(all.sort((a, b) => b.checkDate.localeCompare(a.checkDate)));
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  openDialog(): void {
    const ref = this.dialog.open(CheckinDialogComponent);
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const { indicatorId, ...dto } = result;
      this.indicatorSvc.addCheckIn(indicatorId, dto).subscribe({
        next: () => {
          this.snack.open('Check-in salvo!', '', { duration: 2500 });
          this.load();
        },
        error: () => this.snack.open('Erro ao salvar check-in.', '', { duration: 3000 }),
      });
    });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}
