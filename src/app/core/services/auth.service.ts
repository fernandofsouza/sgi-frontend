import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { InteractionStatus, AccountInfo } from '@azure/msal-browser';
import { filter, takeUntil } from 'rxjs';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal      = inject(MsalService);
  private readonly broadcast = inject(MsalBroadcastService);
  private readonly destroy$  = new Subject<void>();

  private readonly _user    = signal<CurrentUser | null>(null);
  private readonly _loading = signal(true);

  readonly user    = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null || !environment.entraId.enabled);

  constructor() {
    if (!environment.entraId.enabled) {
      // DEV / Heroku sem Entra ID: usuário mock
      this._user.set({ id: 'dev-user', name: 'Dev User', email: 'dev@sgi.local', roles: ['SGI_ADMIN'] });
      this._loading.set(false);
      return;
    }

    this.broadcast.inProgress$
      .pipe(
        filter(status => status === InteractionStatus.None),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const account = this.msal.instance.getActiveAccount() ?? this.msal.instance.getAllAccounts()[0];
        if (account) {
          this._user.set(this.mapAccount(account));
        }
        this._loading.set(false);
      });
  }

  login(): void {
    this.msal.loginRedirect({ scopes: environment.entraId.scopes });
  }

  logout(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.msal.logoutRedirect();
  }

  private mapAccount(account: AccountInfo): CurrentUser {
    const claims = account.idTokenClaims as Record<string, unknown>;
    return {
      id:    account.localAccountId,
      name:  account.name ?? account.username,
      email: account.username,
      roles: (claims?.['roles'] as string[]) ?? [],
    };
  }
}
