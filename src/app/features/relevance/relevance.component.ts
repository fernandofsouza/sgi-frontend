import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ScaleLabel { value: number; label: string; }
interface RelevanceCriteria { id: string; name: string; description: string; active: boolean; scaleLabels: ScaleLabel[]; }

@Component({
  selector: 'app-relevance',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatChipsModule, ReactiveFormsModule,
  ],
  template: `
    <div class="relevance-page">
      <header class="page-header">
        <div>
          <h1><mat-icon>star_rate</mat-icon> Critérios de Relevância</h1>
          <p class="subtitle">Defina como os indicadores são avaliados por impacto</p>
        </div>
        <button mat-raised-button color="primary" (click)="openForm()">
          <mat-icon>add</mat-icon> Novo Critério
        </button>
      </header>

      @if (loading()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <div class="criteria-list">
          @for (c of criteria(); track c.id) {
            <mat-card class="criteria-card">
              <mat-card-header>
                <mat-card-title>{{ c.name }}</mat-card-title>
                <div class="card-actions">
                  <button mat-icon-button (click)="openForm(c)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="delete(c.id)" matTooltip="Remover">
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </mat-card-header>
              <mat-card-content>
                <p class="description">{{ c.description }}</p>
                <div class="scale-grid">
                  @for (s of c.scaleLabels; track s.value) {
                    <div class="scale-chip">
                      <span class="scale-num">{{ s.value }}</span>
                      <span class="scale-lbl">{{ s.label }}</span>
                    </div>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          }

          @if (criteria().length === 0) {
            <div class="empty-state">
              <mat-icon>star_border</mat-icon>
              <p>Nenhum critério de relevância cadastrado.</p>
            </div>
          }
        </div>

        <!-- ── Formulário inline ─────────────────────────────────────── -->
        @if (showForm()) {
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>{{ editingId() ? 'Editar' : 'Novo' }} Critério</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="form" (ngSubmit)="save()" class="form-fields">
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Nome *</mat-label>
                  <input matInput formControlName="name" />
                </mat-form-field>

                <mat-form-field appearance="outline" class="full">
                  <mat-label>Descrição</mat-label>
                  <textarea matInput rows="2" formControlName="description"></textarea>
                </mat-form-field>

                <div class="scale-section">
                  <p class="scale-title">Escala de avaliação (1 a 5)</p>
                  <div formArrayName="scaleLabels" class="scale-inputs">
                    @for (ctrl of scaleArray.controls; track $index; let i = $index) {
                      <div [formGroupName]="i" class="scale-row">
                        <span class="scale-num-badge">{{ i + 1 }}</span>
                        <mat-form-field appearance="outline" class="scale-field">
                          <mat-label>Rótulo {{ i + 1 }}</mat-label>
                          <input matInput formControlName="label" />
                        </mat-form-field>
                      </div>
                    }
                  </div>
                </div>

                <div class="form-actions">
                  <button mat-stroked-button type="button" (click)="cancelForm()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit"
                          [disabled]="form.invalid || saving()">
                    <mat-icon>save</mat-icon> Salvar
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .relevance-page { display: flex; flex-direction: column; gap: 24px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-header h1 { font-size: 26px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
    .subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px; }

    .loading-center { display: flex; justify-content: center; padding: 64px; }
    .empty-state { text-align: center; padding: 64px; color: #94a3b8; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; margin-bottom: 12px; display: block; }

    .criteria-list { display: flex; flex-direction: column; gap: 16px; }
    .criteria-card mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .criteria-card mat-card-content { padding: 16px !important; }
    .card-actions { display: flex; gap: 4px; }
    .description { color: #475569; font-size: 14px; margin: 0 0 16px; }

    .scale-grid { display: flex; gap: 8px; flex-wrap: wrap; }
    .scale-chip { display: flex; align-items: center; gap: 6px; background: #f1f5f9; border-radius: 20px; padding: 4px 12px; }
    .scale-num { width: 22px; height: 22px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .scale-lbl { font-size: 13px; color: #374151; }

    .form-card mat-card-content { padding: 16px !important; }
    .form-fields { display: flex; flex-wrap: wrap; gap: 12px; }
    .full { flex: 1 1 100%; }

    .scale-section { flex: 1 1 100%; }
    .scale-title { font-size: 13px; font-weight: 600; color: #374151; margin: 0 0 10px; }
    .scale-inputs { display: flex; flex-direction: column; gap: 8px; }
    .scale-row { display: flex; align-items: center; gap: 12px; }
    .scale-num-badge { width: 32px; height: 32px; border-radius: 50%; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .scale-field { flex: 1; }

    .form-actions { display: flex; justify-content: flex-end; gap: 8px; flex: 1 1 100%; }
  `],
})
export class RelevanceComponent implements OnInit {
  private readonly http  = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);
  private readonly fb    = inject(FormBuilder);
  private readonly base  = `${environment.apiUrl}/relevance-criteria`;

  readonly loading   = signal(false);
  readonly saving    = signal(false);
  readonly showForm  = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly criteria  = signal<RelevanceCriteria[]>([]);

  readonly form = this.fb.group({
    name:        ['', Validators.required],
    description: [''],
    scaleLabels: this.fb.array(
      [1,2,3,4,5].map(v => this.fb.group({ value: [v], label: ['', Validators.required] }))
    ),
  });

  get scaleArray() { return this.form.get('scaleLabels') as FormArray; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.http.get<RelevanceCriteria[]>(this.base).subscribe({
      next: c => { this.criteria.set(c); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openForm(c?: RelevanceCriteria): void {
    this.showForm.set(true);
    this.editingId.set(c?.id ?? null);
    this.form.reset();

    if (c) {
      this.form.patchValue({ name: c.name, description: c.description });
      this.scaleArray.controls.forEach((ctrl, i) => {
        const lbl = c.scaleLabels.find(s => s.value === i + 1);
        ctrl.patchValue({ value: i + 1, label: lbl?.label ?? '' });
      });
    } else {
      const defaults = ['Baixo', 'Médio', 'Alto', 'Muito Alto', 'Máximo'];
      this.scaleArray.controls.forEach((ctrl, i) => {
        ctrl.patchValue({ value: i + 1, label: defaults[i] });
      });
    }
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const payload = this.form.value;
    const id = this.editingId();
    const op = id
      ? this.http.put(`${this.base}/${id}`, payload)
      : this.http.post(this.base, payload);

    op.subscribe({
      next: () => {
        this.snack.open('Critério salvo!', '', { duration: 2500 });
        this.cancelForm();
        this.load();
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  delete(id: string): void {
    this.http.delete(`${this.base}/${id}`).subscribe(() => {
      this.snack.open('Critério removido.', '', { duration: 2500 });
      this.load();
    });
  }
}
