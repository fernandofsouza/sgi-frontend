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
  templateUrl: './indicator-form.component.html',
  styleUrl: './indicator-form.component.css',
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
