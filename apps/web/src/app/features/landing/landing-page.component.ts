import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SharpBadgeComponent } from '@shared/components/sharp-badge.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

interface TestimonialItem {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly domain: string;
  readonly tag: 'Medical' | 'Education' | 'Consulting';
}

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink, SharpBadgeComponent, SharpIconComponent],
  templateUrl: './landing-page.component.html',
})
export class LandingPageComponent {
  readonly testimonials: readonly TestimonialItem[] = [
    {
      quote:
        'Moving from generic link trees to my own domain doubled patient bookings in two weeks. Patients see my consultation fees in their local currency and never have to pay upfront.',
      name: 'Dr. Elena Vance, MD',
      role: 'Senior Cardiologist · Boston',
      domain: 'drelenavance.com',
      tag: 'Medical',
    },
    {
      quote:
        'My students book 1-on-1 physics mentorship slots directly from my site. The instant WhatsApp & email confirmation links save me hours of back-and-forth every week.',
      name: 'Prof. Marcus Chen',
      role: 'Applied Physics Mentor · Toronto',
      domain: 'marcuschenphysics.edu',
      tag: 'Education',
    },
    {
      quote:
        'Zero bloat, razor-sharp typography, and strict custom-domain isolation—my clients only ever see my practice, never another directory.',
      name: 'Dr. Ananya Rao',
      role: 'Clinical Psychologist · Bengaluru',
      domain: 'ananyaraoclinic.in',
      tag: 'Consulting',
    },
  ];
}
