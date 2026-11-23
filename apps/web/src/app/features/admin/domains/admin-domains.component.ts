import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DomainResolutionResponse } from '@profilease/types';
import { ProfileService } from '@service/profile.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpBadgeComponent } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-admin-domains',
  imports: [
    RouterLink,
    SharpButtonComponent,
    SharpBadgeComponent,
    SharpIconComponent,
  ],
  templateUrl: './admin-domains.component.html',
})
export class AdminDomainsComponent implements OnInit {
  protected readonly profileService = inject(ProfileService);
  readonly testResult = signal<DomainResolutionResponse | null>(null);

  ngOnInit(): void {
    this.profileService.loadAll().subscribe();
  }

  testResolution(host: string): void {
    const clean = host.trim();
    if (!clean) return;

    this.profileService.resolveCustomDomain(clean).subscribe({
      next: (res) => {
        this.testResult.set(res);
      },
      error: () => {
        this.testResult.set({ matched: false });
      },
    });
  }
}
