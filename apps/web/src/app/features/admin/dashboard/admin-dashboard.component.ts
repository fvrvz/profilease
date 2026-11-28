import { Component, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubscriptionPlan } from '@profilease/types';
import { ProfileService } from '@service/profile.service';
import { SharpBadgeComponent, BadgeVariant } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterLink,
    SharpBadgeComponent,
    SharpIconComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  readonly profileService = inject(ProfileService);

  readonly customDomainsCount = computed(() => {
    return this.profileService.profiles().filter((p) => !!p.customDomain).length;
  });

  readonly totalServicesCount = computed(() => {
    return this.profileService
      .profiles()
      .reduce((sum, p) => sum + (p.services ? p.services.length : 0), 0);
  });

  ngOnInit(): void {
    this.profileService.loadAll().subscribe();
  }

  getProfessionBadge(profession: string): BadgeVariant {
    switch (profession) {
      case 'doctor':
        return 'teal';
      case 'teacher':
        return 'indigo';
      default:
        return 'neutral';
    }
  }

  updatePlan(id: string, event: Event): void {
    const plan = (event.target as HTMLSelectElement).value as SubscriptionPlan;
    this.profileService.update({ id, subscriptionPlan: plan }).subscribe();
  }

  deleteProfile(id: string): void {
    if (confirm('Are you sure you want to delete this client profile?')) {
      this.profileService.delete(id).subscribe();
    }
  }
}
