import { Component, OnInit, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { SystemConfigService } from '../../core/services/system-config.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatChipsModule, MatSnackBarModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
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
