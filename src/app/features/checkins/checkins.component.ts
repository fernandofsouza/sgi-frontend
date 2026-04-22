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
  templateUrl: './checkins.component.html',
  styleUrl: './checkins.component.css',
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
