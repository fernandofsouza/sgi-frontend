import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent implements OnInit {
  private readonly msal = inject(MsalService);

  ngOnInit(): void {
    if (environment.entraId.enabled) {
      this.msal.instance.initialize().then(() => {
        this.msal.instance.handleRedirectPromise();
      });
    }
  }
}
