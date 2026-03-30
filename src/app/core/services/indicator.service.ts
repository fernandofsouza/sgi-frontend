import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  IndicatorSummary, IndicatorDetail, PageResponse,
  IndicatorFilter, CheckIn, RelevanceAssessment
} from '../models/indicator.model';

@Injectable({ providedIn: 'root' })
export class IndicatorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/indicators`;

  findAll(filter: IndicatorFilter = {}): Observable<PageResponse<IndicatorSummary>> {
    let params = new HttpParams();
    if (filter.year)            params = params.set('year',           filter.year);
    if (filter.range && filter.range !== 'all') params = params.set('range', filter.range);
    if (filter.label && filter.label !== 'all') params = params.set('label', filter.label);
    if (filter.creationStatus)  params = params.set('creationStatus', filter.creationStatus);
    if (filter.progressStatus)  params = params.set('progressStatus', filter.progressStatus);
    if (filter.page !== undefined) params = params.set('page',        filter.page);
    if (filter.size !== undefined) params = params.set('size',        filter.size ?? 20);
    return this.http.get<PageResponse<IndicatorSummary>>(this.base, { params });
  }

  findById(id: string): Observable<IndicatorDetail> {
    return this.http.get<IndicatorDetail>(`${this.base}/${id}`);
  }

  findRoots(): Observable<IndicatorSummary[]> {
    return this.http.get<IndicatorSummary[]>(`${this.base}/roots`);
  }

  findChildren(parentId: string): Observable<IndicatorSummary[]> {
    return this.http.get<IndicatorSummary[]>(`${this.base}/${parentId}/children`);
  }

  create(data: Partial<IndicatorDetail>): Observable<IndicatorDetail> {
    return this.http.post<IndicatorDetail>(this.base, data);
  }

  update(id: string, data: Partial<IndicatorDetail>): Observable<IndicatorDetail> {
    return this.http.put<IndicatorDetail>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addCheckIn(indicatorId: string, data: Partial<CheckIn>): Observable<CheckIn> {
    return this.http.post<CheckIn>(`${this.base}/${indicatorId}/checkins`, data);
  }

  listCheckIns(indicatorId: string): Observable<CheckIn[]> {
    return this.http.get<CheckIn[]>(`${this.base}/${indicatorId}/checkins`);
  }

  updateRelevance(indicatorId: string, assessments: RelevanceAssessment[]): Observable<void> {
    return this.http.put<void>(`${this.base}/${indicatorId}/relevance`, assessments);
  }
}
