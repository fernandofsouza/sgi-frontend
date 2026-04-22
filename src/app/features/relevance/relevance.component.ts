import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
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
  templateUrl: './relevance.component.html',
  styleUrl: './relevance.component.css',
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
