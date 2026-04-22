import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe, NgClass } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IndicatorService } from '../../../core/services/indicator.service';
import { TeamMemberService } from '../../../core/services/team-member.service';
import { IndicatorDetail, TeamMember } from '../../../core/models/indicator.model';

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
  templateUrl: './indicator-detail.component.html',
  styleUrl: './indicator-detail.component.css',
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
