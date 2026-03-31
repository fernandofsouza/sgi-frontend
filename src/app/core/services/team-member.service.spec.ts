import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TeamMemberService } from './team-member.service';
import { TeamMember } from '../models/indicator.model';
import { environment } from '../../../environments/environment';

describe('TeamMemberService', () => {
  let service: TeamMemberService;
  let httpMock: HttpTestingController;
  const BASE = `${environment.apiUrl}/team-members`;

  const mockMember: TeamMember = {
    id: 'm-1',
    name: 'Ana Silva',
    role: 'Product Manager',
    email: 'ana@sgi.gov.br',
    avatarUrl: undefined,
    active: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeamMemberService],
    });
    service = TestBed.inject(TeamMemberService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('findAll', () => {
    it('deve fazer GET para /team-members', () => {
      service.findAll().subscribe(members => {
        expect(members.length).toBe(1);
        expect(members[0].name).toBe('Ana Silva');
      });

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('GET');
      req.flush([mockMember]);
    });
  });

  describe('findById', () => {
    it('deve fazer GET para /team-members/{id}', () => {
      service.findById('m-1').subscribe(member => {
        expect(member.id).toBe('m-1');
      });

      const req = httpMock.expectOne(`${BASE}/m-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockMember);
    });
  });

  describe('create', () => {
    it('deve fazer POST com os dados do novo membro', () => {
      const newMember = { name: 'Carlos', role: 'Dev', email: 'carlos@sgi.gov.br' };

      service.create(newMember as any).subscribe(created => {
        expect(created.id).toBe('m-2');
        expect(created.name).toBe('Carlos');
      });

      const req = httpMock.expectOne(BASE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Carlos');
      req.flush({ ...newMember, id: 'm-2', active: true });
    });
  });

  describe('update', () => {
    it('deve fazer PUT para /team-members/{id}', () => {
      const update = { role: 'Tech Lead' };

      service.update('m-1', update as any).subscribe(updated => {
        expect(updated.role).toBe('Tech Lead');
      });

      const req = httpMock.expectOne(`${BASE}/m-1`);
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockMember, role: 'Tech Lead' });
    });
  });

  describe('delete', () => {
    it('deve fazer DELETE para /team-members/{id}', () => {
      service.delete('m-1').subscribe();

      const req = httpMock.expectOne(`${BASE}/m-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
