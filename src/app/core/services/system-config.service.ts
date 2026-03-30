import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuditLogEntry {
  action: string;
  entityType: 'indicator' | 'checkin' | 'team_member' | 'relevance' | 'settings';
  entityId: string;
  details?: Record<string, unknown>;
  userId: string;
  userName: string;
}

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/audit-log`;

  log(entry: AuditLogEntry): Observable<void> {
    return this.http.post<void>(this.base, entry);
  }
}

// ─── SystemConfig Service ─────────────────────────────────────────────────────

export interface SystemConfig {
  creationStatuses: string[];
  progressStatuses: string[];
}

@Injectable({ providedIn: 'root' })
export class SystemConfigService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/config`;

  getConfig(): Observable<SystemConfig> {
    return this.http.get<SystemConfig>(this.base);
  }

  updateConfig(config: Partial<SystemConfig>): Observable<SystemConfig> {
    return this.http.put<SystemConfig>(this.base, config);
  }
}
