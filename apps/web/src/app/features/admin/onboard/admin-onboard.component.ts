import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';
import {
  ProfessionType,
  ThemeVariant,
  ServiceItem,
  DayAvailability,
  CreateProfileDto,
} from '@profilease/types';
import { ProfileService } from '@service/profile.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-admin-onboard',
  imports: [
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
  ],
  templateUrl: './admin-onboard.component.html',
})
export class AdminOnboardComponent {
  protected readonly profileService = inject(ProfileService);
  private readonly router = inject(Router);

  readonly currentStep = signal<number>(1);
  readonly selectedProfession = signal<ProfessionType>('doctor');
  readonly selectedTheme = signal<ThemeVariant>('medical-teal');

  // Signal Form for identity
  readonly identityModel = signal({
    name: '',
    title: '',
    clinicOrSchoolName: '',
    slug: '',
    customDomain: '',
    email: '',
    phone: '',
    location: '',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=600',
  });

  readonly identityForm = form(this.identityModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.slug, { message: 'Slug is required' });
    required(schema.email, { message: 'Email is required' });
    email(schema.email, { message: 'Valid email required' });
    required(schema.phone, { message: 'Phone is required' });
  });

  // Signal Form for bio
  readonly bioModel = signal({
    bio: '',
    aboutDetailed: '',
    emergencyNotice: '',
  });

  readonly bioForm = form(this.bioModel);

  // Dynamic Credentials List
  readonly credentialsList = signal<string[]>([
    'Board Certified Specialist',
    'Clinical Fellow & Department Lead',
  ]);

  // Dynamic Services List
  readonly servicesList = signal<ServiceItem[]>([
    {
      id: 'srv-init-1',
      title: 'Initial Consultation & Diagnostic Intake',
      description: 'Comprehensive review of medical records, symptoms, and treatment strategy.',
      price: 250,
      durationMinutes: 45,
      category: 'Consultation',
      tags: ['Comprehensive', 'In-Person'],
    },
    {
      id: 'srv-init-2',
      title: 'Virtual Clinical Follow-up',
      description: 'Review of lab findings, medication adjustments, and recovery status.',
      price: 150,
      durationMinutes: 30,
      category: 'Follow-up',
      tags: ['Telehealth', 'Follow-up'],
    },
  ]);

  readonly themes = [
    { id: 'medical-teal' as ThemeVariant, name: 'Medical Teal', desc: 'Clinical Clean', colorClass: 'bg-teal-600' },
    { id: 'academic-indigo' as ThemeVariant, name: 'Academic Indigo', desc: 'Scholarly Modern', colorClass: 'bg-indigo-600' },
    { id: 'editorial-obsidian' as ThemeVariant, name: 'Obsidian', desc: 'Executive Dark', colorClass: 'bg-neutral-900' },
    { id: 'warm-amber' as ThemeVariant, name: 'Warm Amber', desc: 'Pediatric & Coaching', colorClass: 'bg-amber-600' },
  ];

  onProfessionChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value as ProfessionType;
    this.selectedProfession.set(val);

    if (val === 'doctor') {
      this.selectedTheme.set('medical-teal');
    } else if (val === 'teacher') {
      this.selectedTheme.set('academic-indigo');
    } else {
      this.selectedTheme.set('editorial-obsidian');
    }
  }

  addCredential(inputElem: HTMLInputElement): void {
    const val = inputElem.value.trim();
    if (val) {
      this.credentialsList.update((prev) => [...prev, val]);
      inputElem.value = '';
    }
  }

  removeCredential(index: number): void {
    this.credentialsList.update((prev) => prev.filter((_, i) => i !== index));
  }

  addService(
    titleElem: HTMLInputElement,
    priceElem: HTMLInputElement,
    durElem: HTMLInputElement,
    descElem: HTMLTextAreaElement
  ): void {
    const title = titleElem.value.trim();
    const price = Number(priceElem.value) || 100;
    const duration = Number(durElem.value) || 30;
    const desc = descElem.value.trim();

    if (!title) return;

    const newSrv: ServiceItem = {
      id: `srv-${Date.now()}`,
      title,
      description: desc || 'Professional session.',
      price,
      durationMinutes: duration,
      category: 'Standard',
      tags: ['Consultation'],
    };

    this.servicesList.update((prev) => [...prev, newSrv]);
    titleElem.value = '';
    priceElem.value = '';
    descElem.value = '';
  }

  removeService(index: number): void {
    this.servicesList.update((prev) => prev.filter((_, i) => i !== index));
  }

  onCompleteOnboarding(): void {
    const idVal = this.identityModel();
    const bioVal = this.bioModel();

    const defaultAvailability: DayAvailability[] = [
      { day: 'Monday', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { day: 'Tuesday', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { day: 'Wednesday', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { day: 'Thursday', enabled: true, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 },
      { day: 'Friday', enabled: true, startTime: '09:00', endTime: '15:00', slotDurationMinutes: 30 },
      { day: 'Saturday', enabled: false, startTime: '10:00', endTime: '13:00', slotDurationMinutes: 30 },
      { day: 'Sunday', enabled: false, startTime: '10:00', endTime: '13:00', slotDurationMinutes: 30 },
    ];

    const dto: CreateProfileDto = {
      slug: idVal.slug,
      customDomain: idVal.customDomain || undefined,
      name: idVal.name,
      profession: this.selectedProfession(),
      title: idVal.title || `${this.selectedProfession().toUpperCase()} Consultant`,
      credentials: this.credentialsList(),
      bio: bioVal.bio || 'Dedicated professional offering personalized client consultations and services.',
      aboutDetailed: bioVal.aboutDetailed || 'Providing excellence through rigorous standards and compassionate guidance.',
      avatarUrl: idVal.avatarUrl,
      location: idVal.location || 'Metropolitan Medical & Academic Center',
      clinicOrSchoolName: idVal.clinicOrSchoolName || `${idVal.name}'s Practice`,
      email: idVal.email,
      phone: idVal.phone,
      emergencyNotice: bioVal.emergencyNotice || undefined,
      theme: this.selectedTheme(),
      services: this.servicesList(),
      availability: defaultAvailability,
      testimonials: [
        {
          id: `test-${Date.now()}`,
          clientName: 'Sarah Jenkins',
          roleOrCondition: 'Verified Client',
          comment: 'Exceptional attention to detail and clear, actionable consultations.',
          rating: 5,
          date: '2026-02-15',
        },
      ],
      socialLinks: [
        { platform: 'linkedin', url: 'https://linkedin.com' },
      ],
      country: 'United States',
      currency: 'USD',
      timezone: 'America/New_York',
      isPublished: true,
    };

    this.profileService.create(dto).subscribe({
      next: (created) => {
        this.router.navigate(['/@' + created.slug]);
      },
    });
  }
}
