import { Component, input, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UpperCasePipe } from '@angular/common';
import { UserProfile, ServiceItem } from '@profilease/types';
import { ProfileService } from '@service/profile.service';
import { SharpBadgeComponent } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';
import { BookingWidgetComponent } from './components/booking-widget.component';

@Component({
  selector: 'app-portfolio-page',
  imports: [
    RouterLink,
    UpperCasePipe,
    SharpBadgeComponent,
    SharpIconComponent,
    BookingWidgetComponent,
  ],
  templateUrl: './portfolio-page.component.html',
})
export class PortfolioPageComponent implements OnInit {
  // Input from route param :slug
  readonly slug = input<string>();

  protected readonly profileService = inject(ProfileService);

  readonly selectedServiceId = signal<string>('');
  readonly profile = this.profileService.currentProfile;

  ngOnInit(): void {
    const slugVal = this.slug();
    if (slugVal) {
      // Remove leading '@' if present from /@dr-smith
      const cleanSlug = slugVal.startsWith('@') ? slugVal.substring(1) : slugVal;
      this.profileService.getBySlugOrId(cleanSlug).subscribe();
    }
  }

  selectServiceAndScroll(service: ServiceItem): void {
    this.selectedServiceId.set(service.id);
    const element = document.getElementById('booking-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  themeClass(): string {
    const theme = this.profile()?.theme;
    switch (theme) {
      case 'medical-teal':
        return 'accent-teal';
      case 'academic-indigo':
        return 'accent-indigo';
      case 'warm-amber':
        return 'accent-amber';
      case 'editorial-obsidian':
      default:
        return 'accent-neutral';
    }
  }

  badgeVariant(): 'teal' | 'indigo' | 'amber' | 'neutral' {
    const prof = this.profile()?.profession;
    switch (prof) {
      case 'doctor':
        return 'teal';
      case 'teacher':
        return 'indigo';
      case 'coach':
      case 'therapist':
        return 'amber';
      default:
        return 'neutral';
    }
  }
}
