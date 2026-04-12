import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IndicatorService } from '../../../core/services/indicator.service';
import { TeamMemberService } from '../../../core/services/team-member.service';
import { SystemConfigService } from '../../../core/services/system-config.service';
import { IndicatorDetail, IndicatorSummary, TeamMember, REFERENCE_RANGES, getReferenceOptions, ReferenceRange } from '../../../core/models/indicator.model';

@Component({
  selector: 'app-indicator-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule,
    MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
  ],
  template: `
    <div class="form-page">
      <header class="page-header">
        <button mat-icon-button routerLink="/indicators"><mat-icon>arrow_back</mat-icon></button>
        <h1>{{ isEdit ? 'Editar' : 'Novo' }} Indicador</h1>
      </header>

      @if (loadingData()) {
        <div class="loading-center"><mat-spinner diameter="40" /></div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">

          <!-- ── Informações básicas ─────────────────────────────────── -->
          <mat-card>
            <mat-card-header><mat-card-title>Informações Básicas</mat-card-title></mat-card-header>
            <mat-card-content class="card-fields">

              <mat-form-field appearance="outline" class="full">
                <mat-label>Título *</mat-label>
                <input matInput formControlName="title" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full">
                <mat-label>Descrição</mat-label>
                <textarea matInput rows="3" formControlName="description"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>ID PDG</mat-label>
                <input matInput formControlName="pdgId" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Data prazo</mat-label>
                <input matInput type="date" formControlName="targetDate" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status de Criação</mat-label>
                <mat-select formControlName="creationStatus">
                  @for (s of creationStatuses(); track s) {
                    <mat-option [value]="s">{{ s }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status de Progresso</mat-label>
                <mat-select formControlName="progressStatus">
                  @for (s of progressStatuses(); track s) {
                    <mat-option [value]="s">{{ s }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Progresso (%)</mat-label>
                <input matInput type="number" min="0" max="100" formControlName="progress" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Indicador Pai</mat-label>
                <mat-select formControlName="parentId">
                  <mat-option value="">Nenhum</mat-option>
                  @for (ind of indicators(); track ind.id) {
                    @if (ind.id !== indicatorId) {
                      <mat-option [value]="ind.id">
                        {{ ind.pdgId ? '[' + ind.pdgId + '] ' : '' }}{{ ind.title }}
                      </mat-option>
                    }
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Observação</mat-label>
                <textarea matInput rows="2" formControlName="observation"></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- ── Período de referência ───────────────────────────────── -->
          <mat-card>
            <mat-card-header><mat-card-title>Período de Referência</mat-card-title></mat-card-header>
            <mat-card-content class="card-fields">
              <mat-form-field appearance="outline">
                <mat-label>Ano *</mat-label>
                <mat-select formControlName="referenceYear">
                  @for (y of years; track y) { <mat-option [value]="y">{{ y }}</mat-option> }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Periodicidade *</mat-label>
                <mat-select formControlName="referenceRange" (ngModelChange)="onRangeChange()">
                  @for (r of referenceRanges; track r.value) {
                    <mat-option [value]="r.value">{{ r.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Referência *</mat-label>
                <mat-select formControlName="referenceLabel">
                  @for (opt of refOptions(); track opt) {
                    <mat-option [value]="opt">{{ opt }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- ── Responsáveis ───────────────────────────────────────── -->
          <mat-card>
            <mat-card-header><mat-card-title>Responsáveis</mat-card-title></mat-card-header>
            <mat-card-content class="card-fields">
              <mat-form-field appearance="outline" class="full">
                <mat-label>Atribuídos</mat-label>
                <mat-select formControlName="assigneeIds" multiple>
                  @for (m of members(); track m.id) {
                    <mat-option [value]="m.id">{{ m.name }} — {{ m.role }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Editor</mat-label>
                <mat-select formControlName="editorId">
                  <mat-option value="">Nenhum</mat-option>
                  @for (m of members(); track m.id) { <mat-option [value]="m.id">{{ m.name }}</mat-option> }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Validador</mat-label>
                <mat-select formControlName="validatorId">
                  <mat-option value="">Nenhum</mat-option>
                  @for (m of members(); track m.id) { <mat-option [value]="m.id">{{ m.name }}</mat-option> }
                </mat-select>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <!-- ── Critérios de avaliação ─────────────────────────────── -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Critérios de Avaliação</mat-card-title>
              <button mat-icon-button type="button" (click)="addCriteria()" matTooltip="Adicionar critério">
                <mat-icon>add</mat-icon>
              </button>
            </mat-card-header>
            <mat-card-content>
              <div formArrayName="criteria">
                @for (ctrl of criteriaArray.controls; track $index; let i = $index) {
                  <div [formGroupName]="i" class="criteria-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Nome</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Peso (%)</mat-label>
                      <input matInput type="number" formControlName="weight" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Meta</mat-label>
                      <input matInput type="number" formControlName="targetValue" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Unidade</mat-label>
                      <input matInput formControlName="unit" />
                    </mat-form-field>
                    <button mat-icon-button type="button" color="warn" (click)="removeCriteria(i)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }
                @if (criteriaArray.length === 0) {
                  <p class="empty-hint">Nenhum critério adicionado.</p>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- ── Ações ──────────────────────────────────────────────── -->
          <div class="form-actions">
            <button mat-stroked-button type="button" routerLink="/indicators">Cancelar</button>

            @if (isEdit && canDelete()) {
              <button mat-raised-button color="warn" type="button"
                      [disabled]="deleting()"
                      (click)="deleteIndicator()">
                @if (deleting()) { <mat-spinner diameter="20" /> }
                @else { <mat-icon>delete</mat-icon> }
                Excluir indicador
              </button>
            }

            <button mat-raised-button color="primary" type="submit"
                    [disabled]="form.invalid || saving()">
              @if (saving()) { <mat-spinner diameter="20" /> }
              @else { <mat-icon>save</mat-icon> }
              {{ isEdit ? 'Salvar alterações' : 'Criar indicador' }}
            </button>
          </div>

        </form>
      }
    </div>
  `,
  styles: [`
    .form-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; align-items: center; gap: 12px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; }
    .loading-center { display: flex; justify-content: center; padding: 80px; }

    form { display: flex; flex-direction: column; gap: 20px; }
    mat-card-content.card-fields { display: flex; flex-wrap: wrap; gap: 12px; padding: 16px !important; }
    mat-card mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    mat-form-field { min-width: 200px; flex: 1; }
    .full { flex: 1 1 100%; }

    .criteria-row { display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap; margin-bottom: 8px; }
    .criteria-row mat-form-field { min-width: 120px; flex: 1; }

    .empty-hint { text-align: center; color: #94a3b8; padding: 16px; }

    .form-actions { display: flex; justify-content: flex-end; gap: 12px; }
  `],
})
export class IndicatorFormComponent implements OnInit {
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly fb           = inject(FormBuilder);
  private readonly indicatorSvc = inject(IndicatorService);
  private readonly teamSvc      = inject(TeamMemberService);
  private readonly configSvc    = inject(SystemConfigService);
  private readonly snack        = inject(MatSnackBar);

  isEdit = false;
  indicatorId: string | null = null;

  readonly loadingData      = signal(true);
  readonly saving           = signal(false);
  readonly deleting         = signal(false);
  readonly members          = signal<TeamMember[]>([]);
  readonly indicators       = signal<IndicatorSummary[]>([]);
  readonly creationStatuses = signal<string[]>([]);
  readonly progressStatuses = signal<string[]>([]);
  readonly refOptions       = signal<string[]>([]);

  readonly referenceRanges = REFERENCE_RANGES;
  readonly years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);

  readonly form = this.fb.group({
    title:          ['', Validators.required],
    description:    [''],
    pdgId:          [''],
    targetDate:     [''],
    creationStatus: ['Não iniciado'],
    progressStatus: ['Não iniciado'],
    progress:       [0, [Validators.min(0), Validators.max(100)]],
    parentId:       [''],
    observation:    [''],
    referenceYear:  [new Date().getFullYear(), Validators.required],
    referenceRange: ['anual', Validators.required],
    referenceLabel: ['Anual', Validators.required],
    assigneeIds:    [[]],
    editorId:       [''],
    validatorId:    [''],
    criteria:       this.fb.array([]),
  });

  get criteriaArray(): FormArray { return this.form.get('criteria') as FormArray; }

  ngOnInit(): void {
    this.indicatorId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.indicatorId && this.route.snapshot.url.some(s => s.path === 'edit');

    // Carrega dados paralelos
    this.teamSvc.findAll().subscribe(m => this.members.set(m));
    this.indicatorSvc.findAll({ size: 500 }).subscribe(page => this.indicators.set(page.content));
    this.configSvc.getConfig().subscribe(cfg => {
      this.creationStatuses.set(cfg.creationStatuses);
      this.progressStatuses.set(cfg.progressStatuses);
    });

    this.onRangeChange();

    if (this.isEdit && this.indicatorId) {
      this.indicatorSvc.findById(this.indicatorId).subscribe({
        next: ind => {
          this.patchForm(ind);
          this.loadingData.set(false);
        },
        error: () => this.loadingData.set(false),
      });
    } else {
      this.loadingData.set(false);
    }
  }

  private patchForm(ind: IndicatorDetail): void {
    this.form.patchValue({
      title:          ind.title,
      description:    ind.description,
      pdgId:          ind.pdgId,
      targetDate:     ind.targetDate,
      creationStatus: ind.creationStatus,
      progressStatus: ind.progressStatus,
      progress:       ind.progress,
      parentId:       ind.parentId ?? '',
      observation:    ind.observation,
      referenceYear:  ind.referenceYear,
      referenceRange: ind.referenceRange,
      referenceLabel: ind.referenceLabel,
      assigneeIds:    ind.assignees.map(a => a.id) as any,
      editorId:       ind.editor?.id ?? '',
      validatorId:    ind.validator?.id ?? '',
    });
    this.criteriaArray.clear();
    ind.criteria.forEach(c => this.criteriaArray.push(this.buildCriteriaGroup(c)));
    this.onRangeChange();
  }

  onRangeChange(): void {
    const range = this.form.get('referenceRange')?.value as ReferenceRange;
    if (range) {
      const opts = getReferenceOptions(range);
      this.refOptions.set(opts);
      this.form.get('referenceLabel')?.setValue(opts[0] ?? '');
    }
  }

  addCriteria(): void {
    this.criteriaArray.push(this.buildCriteriaGroup());
  }

  removeCriteria(i: number): void {
    this.criteriaArray.removeAt(i);
  }

  private buildCriteriaGroup(c?: any): FormGroup {
    return this.fb.group({
      id:           [c?.id ?? ''],
      name:         [c?.name ?? '', Validators.required],
      weight:       [c?.weight ?? 0, [Validators.min(0), Validators.max(100)]],
      targetValue:  [c?.targetValue ?? 0],
      currentValue: [c?.currentValue ?? 0],
      unit:         [c?.unit ?? ''],
    });
  }

  canDelete(): boolean {
    const status = this.form.get('creationStatus')?.value ?? '';
    return status === 'Não iniciado' || status === 'Em edição';
  }

  deleteIndicator(): void {
    if (!this.indicatorId) return;
    if (!confirm('Tem certeza que deseja excluir este indicador? Esta ação não pode ser desfeita.')) return;
    this.deleting.set(true);
    this.indicatorSvc.delete(this.indicatorId).subscribe({
      next: () => {
        this.snack.open('Indicador excluído.', '', { duration: 2500 });
        this.router.navigate(['/indicators']);
      },
      error: () => {
        this.snack.open('Erro ao excluir indicador.', '', { duration: 3000 });
        this.deleting.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const payload = { ...this.form.value };
    if (!payload.editorId) delete payload.editorId;
    if (!payload.validatorId) delete payload.validatorId;

    const op = this.isEdit && this.indicatorId
      ? this.indicatorSvc.update(this.indicatorId, payload as any)
      : this.indicatorSvc.create(payload as any);

    op.subscribe({
      next: ind => {
        this.snack.open(this.isEdit ? 'Indicador atualizado!' : 'Indicador criado!', '', { duration: 2500 });
        this.router.navigate(['/indicators', ind.id]);
      },
      error: () => this.saving.set(false),
    });
  }
}
