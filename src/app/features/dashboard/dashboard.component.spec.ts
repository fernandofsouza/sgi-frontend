import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { IndicatorService } from '../../core/services/indicator.service';
import { IndicatorSummary, PageResponse } from '../../core/models/indicator.model';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
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
    referenceYear: new Date().getFullYear(),
    referenceRange: 'anual',
    referenceLabel: 'Anual',
    assignees: [],
    checkInCount: 0,
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  const buildPage = (items: IndicatorSummary[]): PageResponse<IndicatorSummary> => ({
    content: items,
    totalElements: items.length,
    totalPages: 1,
    size: 100,
    number: 0,
  });

  beforeEach(async () => {
    indicatorServiceSpy = jasmine.createSpyObj('IndicatorService', ['findAll']);
    indicatorServiceSpy.findAll.and.returnValue(of(buildPage([])));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
        { provide: IndicatorService, useValue: indicatorServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Inicialização ──────────────────────────────────────────────────────────

  describe('inicialização', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve chamar findAll ao iniciar', () => {
      expect(indicatorServiceSpy.findAll).toHaveBeenCalled();
    });

    it('deve iniciar loading como false após carregar', () => {
      expect(component.loading()).toBeFalse();
    });

    it('deve definir filterYear como ano atual', () => {
      expect(component.filterYear).toBe(new Date().getFullYear());
    });
  });

  // ── Stat cards ─────────────────────────────────────────────────────────────

  describe('statCards', () => {
    beforeEach(() => {
      const indicators = [
        buildSummary({ creationStatus: 'Aprovado', progressStatus: 'Em andamento normal' }),
        buildSummary({ id: 'ind-2', creationStatus: 'Aprovado', progressStatus: 'Em andamento em atraso' }),
        buildSummary({ id: 'ind-3', creationStatus: 'Em edição', progressStatus: 'Não iniciado' }),
      ];
      indicatorServiceSpy.findAll.and.returnValue(of(buildPage(indicators)));
      component.loadIndicators();
    });

    it('deve calcular total corretamente', () => {
      const totalCard = component.statCards().find(c => c.label === 'Total');
      expect(totalCard?.value).toBe(3);
    });

    it('deve calcular aprovados corretamente', () => {
      const aprovados = component.statCards().find(c => c.label === 'Aprovados');
      expect(aprovados?.value).toBe(2);
    });

    it('deve calcular em edição corretamente', () => {
      const emEdicao = component.statCards().find(c => c.label === 'Em Edição');
      expect(emEdicao?.value).toBe(1);
    });

    it('deve calcular em atraso corretamente', () => {
      const atRisk = component.statCards().find(c => c.label === 'Em Atraso');
      expect(atRisk?.value).toBe(1);
    });
  });

  // ── Filtros ────────────────────────────────────────────────────────────────

  describe('filtros', () => {
    it('toggleFilter ativa filtro ao clicar uma vez', () => {
      component.toggleFilter('created');
      expect(component.activeFilter()).toBe('created');
    });

    it('toggleFilter desativa filtro ao clicar duas vezes', () => {
      component.toggleFilter('created');
      component.toggleFilter('created');
      expect(component.activeFilter()).toBe('all');
    });

    it('onRangeChange reseta filterLabel para "all"', () => {
      component.filterLabel = 'Jan';
      component.onRangeChange();
      expect(component.filterLabel).toBe('all');
    });
  });

  // ── displayIndicators ──────────────────────────────────────────────────────

  describe('displayIndicators', () => {
    beforeEach(() => {
      const indicators = [
        buildSummary({ creationStatus: 'Aprovado', progressStatus: 'Em andamento normal', progress: 80 }),
        buildSummary({ id: 'ind-2', creationStatus: 'Em edição', progressStatus: 'Não iniciado', progress: 0 }),
      ];
      indicatorServiceSpy.findAll.and.returnValue(of(buildPage(indicators)));
      component.loadIndicators();
    });

    it('exibe todos quando filtro é "all"', () => {
      component.activeFilter.set('all');
      expect(component.displayIndicators().length).toBe(2);
    });

    it('exibe apenas aprovados quando filtro é "created"', () => {
      component.activeFilter.set('created');
      expect(component.displayIndicators().length).toBe(1);
      expect(component.displayIndicators()[0].creationStatus).toBe('Aprovado');
    });

    it('exibe apenas em edição quando filtro é "inEditing"', () => {
      component.activeFilter.set('inEditing');
      expect(component.displayIndicators().length).toBe(1);
      expect(component.displayIndicators()[0].creationStatus).toBe('Em edição');
    });
  });

  // ── Erro de carregamento ───────────────────────────────────────────────────

  describe('tratamento de erro', () => {
    it('deve parar loading mesmo quando API falha', () => {
      indicatorServiceSpy.findAll.and.returnValue(throwError(() => new Error('API error')));
      component.loadIndicators();
      expect(component.loading()).toBeFalse();
    });
  });

  // ── progressClass ──────────────────────────────────────────────────────────

  describe('progressClass', () => {
    it('retorna "green" para em andamento normal', () => {
      expect(component.progressClass('Em andamento normal')).toBe('green');
    });

    it('retorna "red" para em atraso', () => {
      expect(component.progressClass('Em andamento em atraso')).toBe('red');
    });

    it('retorna "gray" para status desconhecido', () => {
      expect(component.progressClass('Qualquer')).toBe('gray');
    });
  });
});
