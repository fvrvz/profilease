import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '@service/profile.service';
import { SharpBadgeComponent } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink,
    SharpBadgeComponent,
    SharpIconComponent,
  ],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent implements OnInit {
  readonly profileService = inject(ProfileService);

  ngOnInit(): void {
    this.profileService.loadAll().subscribe();
  }
}
