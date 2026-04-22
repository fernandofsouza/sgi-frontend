import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TeamMemberService } from '../../core/services/team-member.service';
import { TeamMember } from '../../core/models/indicator.model';

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
  readonly data = inject<TeamMember | undefined>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<TeamMemberDialogComponent>);
  readonly form = inject(FormBuilder).group({
    name:  [this.data?.name  ?? '', Validators.required],
    role:  [this.data?.role  ?? '', Validators.required],
    email: [this.data?.email ?? '', Validators.email],
  });

  save(): void { this.dialogRef.close(this.form.value); }
}

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    MatDialogModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.css',
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
