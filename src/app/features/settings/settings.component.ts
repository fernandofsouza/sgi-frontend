import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { SystemConfigService, SystemConfig } from '../../core/services/system-config.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatChipsModule, MatSnackBarModule,
  ],
  template: `
    <div class="settings-page">
      <header class="page-header">
        <h1><mat-icon>settings</mat-icon> Configurações</h1>
        <p class="subtitle">Customize os status e fluxos do sistema</p>
      </header>

      <!-- Status de criação -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Status de Criação</mat-card-title>
          <mat-card-subtitle>Fluxo de aprovação dos indicadores</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-chip-grid #creationGrid aria-label="Status de criação">
            @for (status of creationStatuses(); track status; let i = $index) {
              <mat-chip-row (removed)="removeCreation(i)">
                {{ status }}
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              </mat-chip-row>
            }
            <input placeholder="Novo status..."
                   [matChipInputFor]="creationGrid"
                   [matChipInputSeparatorKeyCodes]="separatorKeys"
                   (matChipInputTokenEnd)="addCreation($event)" />
          </mat-chip-grid>
        </mat-card-content>
      </mat-card>

      <!-- Status de progresso -->
      <mat-card>
        <mat-card-header>
          <mat-card-title>Status de Progresso</mat-card-title>
          <mat-card-subtitle>Situações de acompanhamento</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-chip-grid #progressGrid aria-label="Status de progresso">
            @for (status of progressStatuses(); track status; let i = $index) {
              <mat-chip-row (removed)="removeProgress(i)">
                {{ status }}
                <button matChipRemove><mat-icon>cancel</mat-icon></button>
              </mat-chip-row>
            }
            <input placeholder="Novo status..."
                   [matChipInputFor]="progressGrid"
                   [matChipInputSeparatorKeyCodes]="separatorKeys"
                   (matChipInputTokenEnd)="addProgress($event)" />
          </mat-chip-grid>
        </mat-card-content>
      </mat-card>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="save()">
          <mat-icon>save</mat-icon> Salvar configurações
        </button>
      </div>
    </div>
  `,
  styles: [`
    .settings-page { display: flex; flex-direction: column; gap: 24px; }
    .page-header h1 { font-size: 26px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
    .subtitle { color: #64748b; margin: 4px 0 0; font-size: 14px; }
    mat-card-content { padding: 16px !important; }
    .actions { display: flex; justify-content: flex-end; }
  `],
})
export class SettingsComponent implements OnInit {
  private readonly configSvc = inject(SystemConfigService);
  private readonly snack     = inject(MatSnackBar);

  readonly separatorKeys = [ENTER, COMMA];
  readonly creationStatuses = signal<string[]>([]);
  readonly progressStatuses = signal<string[]>([]);

  ngOnInit(): void {
    this.configSvc.getConfig().subscribe(config => {
      this.creationStatuses.set(config.creationStatuses);
      this.progressStatuses.set(config.progressStatuses);
    });
  }

  addCreation(event: MatChipInputEvent): void {
    const v = event.value.trim();
    if (v) this.creationStatuses.update(s => [...s, v]);
    event.chipInput.clear();
  }

  removeCreation(i: number): void {
    this.creationStatuses.update(s => s.filter((_, idx) => idx !== i));
  }

  addProgress(event: MatChipInputEvent): void {
    const v = event.value.trim();
    if (v) this.progressStatuses.update(s => [...s, v]);
    event.chipInput.clear();
  }

  removeProgress(i: number): void {
    this.progressStatuses.update(s => s.filter((_, idx) => idx !== i));
  }

  save(): void {
    this.configSvc.updateConfig({
      creationStatuses: this.creationStatuses(),
      progressStatuses: this.progressStatuses(),
    }).subscribe(() => {
      this.snack.open('Configurações salvas!', '', { duration: 2500 });
    });
  }
}
