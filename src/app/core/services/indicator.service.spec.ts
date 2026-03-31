import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IndicatorService } from './indicator.service';
import { IndicatorDetail, IndicatorSummary, PageResponse } from '../models/indicator.model';
import { environment } from '../../../environments/environment';

describe('IndicatorService', () => {
  let service: IndicatorService;
  let httpMock: HttpTestingController;
  const BASE = `${environment.apiUrl}/indicators`;

  const mockSummary: IndicatorSummary = {
    id: 'ind-1',
    seqId: 1,
    title: 'Aumentar MRR',
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
    checkInCount: 2,
    updatedAt: new Date().toISOString(),
  };

  const mockDetail: IndicatorDetail = {
    ...mockSummary,
    description: 'Crescer MRR em 40%',
    childrenIds: [],
    editor: null,
    validator: null,
    observation: '',
    criteria: [],
    achievementScale: [],
    checkIns: [],
    relevanceAssessments: [],
    createdAt: new Date().toISOString(),
  };

  const mockPage: PageResponse<IndicatorSummary> = {
    content: [mockSummary],
    totalElements: 1,
    totalPages: 1,
    size: 20,
    number: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IndicatorService],
    });
    service = TestBed.inject(IndicatorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve fazer GET para /indicators sem filtros', () => {
      service.findAll().subscribe(page => {
        expect(page.content.length).toBe(1);
        expect(page.content[0].id).toBe('ind-1');
      });

      const req = httpMock.expectOne(r => r.url === BASE);
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });

    it('deve incluir parâmetros de filtro na URL', () => {
      service.findAll({ year: 2026, range: 'anual', label: 'Anual', page: 0, size: 10 }).subscribe();

      const req = httpMock.expectOne(r =>
        r.url === BASE &&
        r.params.get('year') === '2026' &&
        r.params.get('range') === 'anual' &&
        r.params.get('label') === 'Anual'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockPage);
    });

    it('não deve incluir filtros vazios ou "all" na URL', () => {
      service.findAll({ range: 'all', label: 'all' }).subscribe();

      const req = httpMock.expectOne(r => r.url === BASE);
      expect(req.request.params.has('range')).toBeFalse();
      expect(req.request.params.has('label')).toBeFalse();
      req.flush(mockPage);
    });
  });

  // ── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('deve fazer GET para /indicators/{id}', () => {
      service.findById('ind-1').subscribe(detail => {
        expect(detail.id).toBe('ind-1');
        expect(detail.title).toBe('Aumentar MRR');
      });

      const req = httpMock.expectOne(`${BASE}/ind-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockDetail);
    });
  });

  // ── findRoots ───────────────────────────────────────────────────────────────

  describe('findRoots', () => {
    it('deve fazer GET para /indicators/roots', () => {
      service.findRoots().subscribe(roots => {
        expect(roots.length).toBe(1);
      });

      const req = httpMock.expectOne(`${BASE}/roots`);
      expect(req.request.method).toBe('GET');
      req.flush([mockSummary]);
    });
  });

  // ── findChildren ────────────────────────────────────────────────────────────

  describe('findChildren', () => {
    it('deve fazer GET para /indicators/{id}/children', () => {
      service.findChildren('parent-1').subscribe(children => {
        expect(children.length).toBe(1);
      });

      const req = httpMock.expectOne(`${BASE}/parent-1/children`);
      expect(req.request.method).toBe('GET');
      req.flush([mockSummary]);
    });
  });

  // ── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('deve fazer POST para /indicators com body correto', () => {
      const payload = { title: 'Novo', referenceYear: 2026, referenceRange: 'anual', referenceLabel: 'Anual' };

      service.create(payload as any).subscribe(created => {
        expect(created.id).toBe('ind-1');
      });

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.title).toBe('Novo');
      req.flush(mockDetail);
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('deve fazer PUT para /indicators/{id}', () => {
      const payload = { progress: 80 };

      service.update('ind-1', payload as any).subscribe(updated => {
        expect(updated.id).toBe('ind-1');
      });

      const req = httpMock.expectOne(`${BASE}/ind-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.progress).toBe(80);
      req.flush(mockDetail);
    });
  });

  // ── delete ──────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deve fazer DELETE para /indicators/{id}', () => {
      service.delete('ind-1').subscribe();

      const req = httpMock.expectOne(`${BASE}/ind-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ── addCheckIn ──────────────────────────────────────────────────────────────

  describe('addCheckIn', () => {
    it('deve fazer POST para /indicators/{id}/checkins', () => {
      const checkIn = { checkDate: '2026-03-30', progress: 70, notes: 'Ok', authorId: 'm-1' };

      service.addCheckIn('ind-1', checkIn as any).subscribe(ck => {
        expect(ck.id).toBeDefined();
      });

      const req = httpMock.expectOne(`${BASE}/ind-1/checkins`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 'ck-1', progress: 70 });
    });
  });
});
