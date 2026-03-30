import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TeamMember } from '../models/indicator.model';

@Injectable({ providedIn: 'root' })
export class TeamMemberService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/team-members`;

  findAll(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(this.base);
  }

  findById(id: string): Observable<TeamMember> {
    return this.http.get<TeamMember>(`${this.base}/${id}`);
  }

  create(data: Partial<TeamMember>): Observable<TeamMember> {
    return this.http.post<TeamMember>(this.base, data);
  }

  update(id: string, data: Partial<TeamMember>): Observable<TeamMember> {
    return this.http.put<TeamMember>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
