import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, required, email } from '@angular/forms/signals';
import {
  CreateProfileDto,
  ThemeVariant,
  ServiceItem,
  DayAvailability,
  SocialLink,
  SocialPlatform,
} from '@profilease/types';
import { ProfileService } from '@service/profile.service';
import { CurrencyService } from '@service/currency.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';
import { SharpImageUploaderComponent } from '@shared/components/sharp-image-uploader.component';
import { SharpSelectComponent, SharpSelectOption } from '@shared/components/sharp-select.component';

@Component({
  selector: 'app-admin-onboard',
  standalone: true,
  imports: [
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
    SharpImageUploaderComponent,
    SharpSelectComponent,
  ],
  templateUrl: './admin-onboard.component.html',
})
export class AdminOnboardComponent {
  protected readonly profileService = inject(ProfileService);
  protected readonly currencyService = inject(CurrencyService);
  private readonly router = inject(Router);

  readonly currentStep = signal<number>(1);

  // Universal Professions List
  readonly professionOptions: readonly SharpSelectOption[] = [
    { value: 'doctor', label: 'Doctor / Physician', sublabel: 'MD, Specialist, Surgeon', icon: 'stethoscope' },
    { value: 'nurse', label: 'Nurse / Practitioner', sublabel: 'RN, NP, Clinical Nurse', icon: 'stethoscope' },
    { value: 'engineer', label: 'Engineer', sublabel: 'Software, Mechanical, Civil', icon: 'briefcase' },
    { value: 'developer', label: 'Developer / Programmer', sublabel: 'Full-Stack, Backend, Web', icon: 'briefcase' },
    { value: 'teacher', label: 'Teacher / Educator', sublabel: 'Professor, Instructor, Tutor', icon: 'graduation' },
    { value: 'student', label: 'Student / Scholar', sublabel: 'PhD, Researcher, Apprentice', icon: 'graduation' },
    { value: 'therapist', label: 'Therapist / Counselor', sublabel: 'Psychologist, Mental Health', icon: 'user' },
    { value: 'coach', label: 'Coach / Mentor', sublabel: 'Executive, Fitness, Career', icon: 'star' },
    { value: 'consultant', label: 'Consultant / Advisor', sublabel: 'Strategy, Business, Tech', icon: 'briefcase' },
    { value: 'designer', label: 'Designer / Creative', sublabel: 'UI/UX, Graphic, Product', icon: 'star' },
    { value: 'lawyer', label: 'Lawyer / Attorney', sublabel: 'Legal Counsel, Advocate', icon: 'shield' },
    { value: 'accountant', label: 'Accountant / CPA', sublabel: 'Finance, Tax, Auditor', icon: 'briefcase' },
    { value: 'creator', label: 'Content Creator / Writer', sublabel: 'Author, Journalist, Video', icon: 'star' },
    { value: 'artist', label: 'Artist / Photographer', sublabel: 'Visual Arts, Music, Photo', icon: 'star' },
    { value: 'other', label: 'Custom / Other', sublabel: 'Enter your custom profession', icon: 'user' },
  ];

  readonly selectedProfessionStr = signal<string>('doctor');
  readonly customProfession = signal<string>('');
  readonly selectedTheme = signal<ThemeVariant>('medical-teal');

  // Configurable Currency (automatically detects user currency, editable)
  readonly selectedCurrency = signal<string>(this.currencyService.activeCurrency());

  // Social Links state
  readonly socialPlatformOptions: readonly SharpSelectOption[] = [
    { value: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
    { value: 'github', label: 'GitHub', icon: 'github' },
    { value: 'twitter', label: 'X (Twitter)', icon: 'twitter' },
    { value: 'instagram', label: 'Instagram', icon: 'instagram' },
    { value: 'youtube', label: 'YouTube', icon: 'youtube' },
    { value: 'website', label: 'Personal Website / Portfolio', icon: 'globe' },
    { value: 'facebook', label: 'Facebook', icon: 'facebook' },
    { value: 'discord', label: 'Discord', icon: 'discord' },
  ];

  readonly newSocialPlatform = signal<string>('linkedin');
  readonly socialLinksList = signal<SocialLink[]>([]);

  // Signal Form for identity (clean empty slate, no prefilled values)
  readonly identityModel = signal({
    name: '',
    title: '',
    clinicOrSchoolName: '',
    slug: '',
    email: '',
    phone: '',
    location: '',
    avatarUrl: '',
  });

  readonly identityForm = form(this.identityModel, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.slug, { message: 'Slug is required' });
    required(schema.email, { message: 'Email is required' });
    email(schema.email, { message: 'Valid email required' });
    required(schema.phone, { message: 'Phone is required' });
    required(schema.avatarUrl, { message: 'Avatar image is mandatory. Provide Image URL or Upload & Crop.' });
  });

  onAvatarUrlChange(newUrl: string): void {
    this.identityModel.update((m) => ({ ...m, avatarUrl: newUrl }));
  }

  // Auto-generate URL slug from practitioner name
  onNameChange(name: string): void {
    if (!this.identityModel().slug) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      this.identityModel.update((m) => ({ ...m, slug: generated }));
    }
  }

  // Signal Form for bio (clean empty slate)
  readonly bioModel = signal({
    bio: '',
    aboutDetailed: '',
    emergencyNotice: '',
  });

  readonly bioForm = form(this.bioModel);

  // Dynamic Credentials List (clean empty slate)
  readonly credentialsList = signal<string[]>([]);

  // Dynamic Services List (clean empty slate)
  readonly servicesList = signal<ServiceItem[]>([]);

  readonly themes = [
    { id: 'medical-teal' as ThemeVariant, name: 'Medical Teal', desc: 'Clinical Clean', colorClass: 'bg-teal-600' },
    { id: 'academic-indigo' as ThemeVariant, name: 'Academic Indigo', desc: 'Scholarly Modern', colorClass: 'bg-indigo-600' },
    { id: 'editorial-obsidian' as ThemeVariant, name: 'Obsidian', desc: 'Executive Dark', colorClass: 'bg-neutral-900' },
    { id: 'warm-amber' as ThemeVariant, name: 'Warm Amber', desc: 'Pediatric & Coaching', colorClass: 'bg-amber-600' },
  ];

  onProfessionSelected(val: string): void {
    this.selectedProfessionStr.set(val);
    if (val === 'doctor' || val === 'nurse') {
      this.selectedTheme.set('medical-teal');
    } else if (val === 'teacher' || val === 'student') {
      this.selectedTheme.set('academic-indigo');
    } else if (val === 'coach' || val === 'creator') {
      this.selectedTheme.set('warm-amber');
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

  // Social Links management
  addSocialLink(urlInput: HTMLInputElement): void {
    const url = urlInput.value.trim();
    if (!url) return;

    const platform = this.newSocialPlatform() as SocialPlatform;
    this.socialLinksList.update((prev) => [...prev, { platform, url }]);
    urlInput.value = '';
  }

  removeSocialLink(index: number): void {
    this.socialLinksList.update((prev) => prev.filter((_, i) => i !== index));
  }

  // Services management
  addService(
    titleElem: HTMLInputElement,
    priceElem: HTMLInputElement,
    durElem: HTMLInputElement,
    descElem: HTMLTextAreaElement
  ): void {
    const title = titleElem.value.trim();
    const price = Number(priceElem.value) || 0;
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

    const resolvedProfession =
      this.selectedProfessionStr() === 'other' && this.customProfession().trim()
        ? this.customProfession().trim()
        : this.selectedProfessionStr();

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
      name: idVal.name,
      profession: resolvedProfession,
      title: idVal.title || `${resolvedProfession.toUpperCase()} Professional`,
      credentials: this.credentialsList(),
      bio: bioVal.bio || 'Dedicated professional offering personalized client consultations and services.',
      aboutDetailed: bioVal.aboutDetailed || 'Providing excellence through rigorous standards and compassionate guidance.',
      avatarUrl: idVal.avatarUrl,
      location: idVal.location || 'Consultation Office / Remote',
      clinicOrSchoolName: idVal.clinicOrSchoolName || `${idVal.name}'s Practice`,
      email: idVal.email,
      phone: idVal.phone,
      emergencyNotice: bioVal.emergencyNotice || undefined,
      theme: this.selectedTheme(),
      services: this.servicesList(),
      availability: defaultAvailability,
      testimonials: [],
      socialLinks: this.socialLinksList(),
      country: this.currencyService.detectedUserCountry() || 'United States',
      currency: this.selectedCurrency(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
      isPublished: true,
    };

    this.profileService.create(dto).subscribe({
      next: (created) => {
        this.router.navigate(['/@' + created.slug]);
      },
    });
  }
}
