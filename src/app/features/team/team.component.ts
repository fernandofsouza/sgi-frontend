import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TeamMemberService } from '../../core/services/team-member.service';
import { TeamMember } from '../../core/models/indicator.model';
import { Component as DialogComp } from '@angular/core';

@Component({
  selector: 'app-team-dialog',
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>{{ data?.id ? 'Editar' : 'Novo' }} Membro</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="member-form">
        <mat-form-field appearance="outline">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Cargo / Papel</mat-label>
          <input matInput formControlName="role" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>E-mail</mat-label>
          <input matInput formControlName="email" type="email" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">Salvar</button>
    </mat-dialog-actions>
  `,
  styles: [`.member-form { display: flex; flex-direction: column; gap: 8px; min-width: 340px; padding-top: 8px; }`],
})
export class TeamMemberDialogComponent {
  data: TeamMember | null = null;
  readonly form = inject(FormBuilder).group({
    name:  ['', Validators.required],
    role:  ['', Validators.required],
    email: ['', Validators.email],
  });
  readonly dialogRef = inject(MatDialog);

  save() { /* handled by parent */ }
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    MatDialogModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="team-page">
      <header class="page-header">
        <div>
          <h1><mat-icon>group</mat-icon> Equipe</h1>
          <p class="subtitle">Membros da equipe e seus perfis</p>
        </div>
        <button mat-raised-button color="primary" (click)="openDialog()">
          <mat-icon>person_add</mat-icon> Novo Membro
        </button>
      </header>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="member-grid">
          @for (member of members(); track member.id) {
            <mat-card class="member-card">
              <mat-card-content>
                <div class="member-header">
                  <div class="avatar">{{ initials(member.name) }}</div>
                  <div class="member-info">
                    <span class="member-name">{{ member.name }}</span>
                    <span class="member-role">{{ member.role }}</span>
                    @if (member.email) {
                      <span class="member-email">{{ member.email }}</span>
                    }
                  </div>
                </div>
                <div class="member-actions">
                  <button mat-icon-button (click)="openDialog(member)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteMember(member.id)" matTooltip="Remover">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .team-page { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-header h1 { font-size: 26px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
    .subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px; }
    .loading-center { display: flex; justify-content: center; padding: 64px; }

    .member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .member-card mat-card-content { padding: 20px !important; }

    .member-header { display: flex; gap: 14px; align-items: center; margin-bottom: 12px; }
    .avatar {
      width: 48px; height: 48px; border-radius: 50%; background: #3b82f6; color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; flex-shrink: 0;
    }
    .member-info { display: flex; flex-direction: column; }
    .member-name { font-weight: 600; font-size: 15px; }
    .member-role { font-size: 13px; color: #64748b; }
    .member-email { font-size: 12px; color: #94a3b8; }

    .member-actions { display: flex; justify-content: flex-end; gap: 4px; }
  `],
})
export class TeamComponent implements OnInit {
  private readonly teamSvc = inject(TeamMemberService);
  private readonly dialog  = inject(MatDialog);
  private readonly snack   = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly members = signal<TeamMember[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.teamSvc.findAll().subscribe({
      next: m => { this.members.set(m); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDialog(member?: TeamMember): void {
    const ref = this.dialog.open(TeamMemberDialogComponent, { data: member });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const op = member?.id
        ? this.teamSvc.update(member.id, result)
        : this.teamSvc.create(result);
      op.subscribe(() => {
        this.snack.open('Membro salvo!', '', { duration: 2500 });
        this.load();
      });
    });
  }

  deleteMember(id: string): void {
    this.teamSvc.delete(id).subscribe(() => {
      this.snack.open('Membro removido.', '', { duration: 2500 });
      this.load();
    });
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }
}
