import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { IndicatorsListComponent } from './indicators-list.component';
import { IndicatorService } from '../../../core/services/indicator.service';
import { IndicatorSummary, PageResponse } from '../../../core/models/indicator.model';
import { PageEvent } from '@angular/material/paginator';

describe('IndicatorsListComponent', () => {
  let component: IndicatorsListComponent;
  let fixture: ComponentFixture<IndicatorsListComponent>;
  let indicatorServiceSpy: jasmine.SpyObj<IndicatorService>;

  const buildSummary = (overrides: Partial<IndicatorSummary> = {}): IndicatorSummary => ({
    id: 'ind-1',
    seqId: 1,
    title: 'Indicador Teste',
    pdgId: 'PDG-001',
    creationStatus: 'Aprovado',
    progressStatus: 'Em andamento normal',
    progress: 60,
    targetDate: '2026-12-31',
    parentId: null,
    referenceYear: 2026,
    referenceRange: 'anual',
    referenceLabel: 'Anual',
    assignees: [],
    checkInCount: 0,
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  const buildPage = (items: IndicatorSummary[], total = items.length): PageResponse<IndicatorSummary> => ({
    content: items,
    totalElements: total,
    totalPages: Math.ceil(total / 20),
    size: 20,
    number: 0,
  });

  beforeEach(async () => {
    indicatorServiceSpy = jasmine.createSpyObj('IndicatorService', ['findAll']);
    indicatorServiceSpy.findAll.and.returnValue(of(buildPage([buildSummary()])));

    await TestBed.configureTestingModule({
      imports: [IndicatorsListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
        { provide: IndicatorService, useValue: indicatorServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(IndicatorsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Inicialização ──────────────────────────────────────────────────────────

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve chamar findAll ao iniciar', () => {
    expect(indicatorServiceSpy.findAll).toHaveBeenCalledTimes(1);
  });

  it('deve carregar indicadores ao iniciar', () => {
    expect(component.indicators().length).toBe(1);
    expect(component.totalElements()).toBe(1);
    expect(component.loading()).toBeFalse();
  });

  // ── Filtros ────────────────────────────────────────────────────────────────

  describe('filtros', () => {
    it('deve chamar findAll com filtro de creationStatus', () => {
      component.filterCreation = 'Aprovado';
      component.load();

      expect(indicatorServiceSpy.findAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ creationStatus: 'Aprovado' })
      );
    });

    it('deve chamar findAll com filtro de progressStatus', () => {
      component.filterProgress = 'Em andamento normal';
      component.load();

      expect(indicatorServiceSpy.findAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ progressStatus: 'Em andamento normal' })
      );
    });

    it('não deve enviar filtros vazios como string vazia', () => {
      component.filterCreation = '';
      component.load();

      expect(indicatorServiceSpy.findAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ creationStatus: undefined })
      );
    });
  });

  // ── Paginação ──────────────────────────────────────────────────────────────

  describe('paginação', () => {
    it('deve atualizar pageIndex e pageSize ao mudar página', () => {
      const pageEvent: PageEvent = { pageIndex: 2, pageSize: 50, length: 100 };
      component.onPage(pageEvent);

      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(50);
      expect(indicatorServiceSpy.findAll).toHaveBeenCalledWith(
        jasmine.objectContaining({ page: 2, size: 50 })
      );
    });
  });

  // ── Tratamento de erro ─────────────────────────────────────────────────────

  describe('tratamento de erro', () => {
    it('deve parar loading quando API retorna erro', () => {
      indicatorServiceSpy.findAll.and.returnValue(throwError(() => new Error('Falha')));
      component.load();
      expect(component.loading()).toBeFalse();
    });
  });

  // ── Badge helpers ──────────────────────────────────────────────────────────

  describe('creationClass', () => {
    it('retorna "green" para Aprovado', () => {
      expect(component.creationClass('Aprovado')).toBe('green');
    });

    it('retorna "yellow" para Em edição', () => {
      expect(component.creationClass('Em edição')).toBe('yellow');
    });

    it('retorna "blue" para Solicitada aprovação', () => {
      expect(component.creationClass('Solicitada aprovação')).toBe('blue');
    });

    it('retorna "gray" para status desconhecido', () => {
      expect(component.creationClass('Qualquer outro')).toBe('gray');
    });
  });

  describe('progressClass', () => {
    it('retorna "green" para Em andamento normal', () => {
      expect(component.progressClass('Em andamento normal')).toBe('green');
    });

    it('retorna "red" para Em andamento em atraso', () => {
      expect(component.progressClass('Em andamento em atraso')).toBe('red');
    });

    it('retorna "blue" para Concluído', () => {
      expect(component.progressClass('Concluído')).toBe('blue');
    });
  });

  // ── Colunas da tabela ──────────────────────────────────────────────────────

  it('deve ter as colunas corretas definidas', () => {
    expect(component.displayedColumns).toContain('seqId');
    expect(component.displayedColumns).toContain('title');
    expect(component.displayedColumns).toContain('creationStatus');
    expect(component.displayedColumns).toContain('progressStatus');
    expect(component.displayedColumns).toContain('progress');
    expect(component.displayedColumns).toContain('targetDate');
    expect(component.displayedColumns).toContain('actions');
  });
});
