import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceMode, SocialLink, SocialPlatform, Testimonial } from '@profilease/types';
import { ClientAuthService } from '@service/client-auth.service';
import { TenantContextService } from '@service/tenant-context.service';
import { ToastService } from '@service/toast.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';
import { SharpImageUploaderComponent } from '@shared/components/sharp-image-uploader.component';
import { SharpSelectComponent, SharpSelectOption } from '@shared/components/sharp-select.component';

@Component({
  selector: 'app-portal-profile',
  standalone: true,
  imports: [
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
    SharpImageUploaderComponent,
    SharpSelectComponent,
  ],
  templateUrl: './portal-profile.component.html',
})
export class PortalProfileComponent implements OnInit {
  private readonly clientAuth = inject(ClientAuthService);
  private readonly toast = inject(ToastService);
  protected readonly tenantContext = inject(TenantContextService);

  readonly currentProfile = this.clientAuth.currentProfile;
  readonly saveSuccess = signal<boolean>(false);

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

  readonly selectedProfession = signal<string>('doctor');

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

  readonly serviceModeOptions: readonly SharpSelectOption[] = [
    { value: 'clinic', label: 'In-Clinic / Office', sublabel: 'Fixed physical office or clinic address', icon: 'globe' },
    { value: 'home-visit', label: 'Home Visits / Mobile Service', sublabel: 'Nurse, physiotherapist, or home-care visits', icon: 'user' },
    { value: 'online', label: 'Online / Telehealth Only', sublabel: '100% remote video or phone consultations', icon: 'globe' },
    { value: 'hybrid', label: 'Hybrid (Clinic + Home / Online)', sublabel: 'Multiple consultation modes available', icon: 'star' },
  ];
  readonly selectedServiceMode = signal<string>('clinic');
  readonly testimonialsList = signal<Testimonial[]>([]);

  readonly profileState = signal({
    name: '',
    title: '',
    avatarUrl: '',
    customDomain: '',
    clinicOrSchoolName: '',
    location: '',
    phone: '',
    credentialsRaw: '',
    bio: '',
    aboutDetailed: '',
    emergencyNotice: '',
    googleReviewsUrl: '',
  });

  readonly profileForm = form(this.profileState, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.title, { message: 'Title is required' });
    required(schema.bio, { message: 'Bio is required' });
    required(schema.avatarUrl, { message: 'Avatar image is mandatory' });
  });

  ngOnInit(): void {
    const p = this.currentProfile();
    if (p) {
      this.selectedProfession.set(p.profession || 'other');
      this.selectedServiceMode.set(p.serviceMode || 'clinic');
      this.socialLinksList.set(p.socialLinks ? [...p.socialLinks] : []);
      this.testimonialsList.set(p.testimonials ? [...p.testimonials] : []);

      this.profileState.set({
        name: p.name,
        title: p.title,
        avatarUrl: p.avatarUrl || '',
        customDomain: p.customDomain || '',
        clinicOrSchoolName: p.clinicOrSchoolName,
        location: p.location,
        phone: p.phone,
        credentialsRaw: (p.credentials || []).join(', '),
        bio: p.bio,
        aboutDetailed: p.aboutDetailed,
        emergencyNotice: p.emergencyNotice || '',
        googleReviewsUrl: p.googleReviewsUrl || '',
      });
    }
  }

  addTestimonial(clientNameInput: HTMLInputElement, roleInput: HTMLInputElement, commentInput: HTMLTextAreaElement): void {
    const clientName = clientNameInput.value.trim();
    const comment = commentInput.value.trim();
    if (!clientName || !comment) return;

    const newItem: Testimonial = {
      id: `test-${Date.now()}`,
      clientName,
      roleOrCondition: roleInput.value.trim() || 'Verified Client',
      comment,
      rating: 5,
      date: new Date().toISOString().slice(0, 10),
    };
    this.testimonialsList.update((prev) => [...prev, newItem]);
    clientNameInput.value = '';
    roleInput.value = '';
    commentInput.value = '';
  }

  removeTestimonial(index: number): void {
    this.testimonialsList.update((prev) => prev.filter((_, i) => i !== index));
  }

  onAvatarChange(newUrl: string): void {
    this.profileState.update((s) => ({ ...s, avatarUrl: newUrl }));
  }

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

  onSaveProfile(event: Event): void {
    event.preventDefault();
    void submit(this.profileForm, async () => {
      const val = this.profileState();
      if (!val.name || !val.title || !val.bio || !val.avatarUrl) return;

      this.toast.startLoading('Saving profile details...');
      try {
        await firstValueFrom(
          this.clientAuth.updateProfile({
            name: val.name,
            title: val.title,
            profession: this.selectedProfession(),
            avatarUrl: val.avatarUrl,
            customDomain: val.customDomain.trim() || undefined,
            clinicOrSchoolName: val.clinicOrSchoolName,
            location: val.location,
            serviceMode: this.selectedServiceMode() as ServiceMode,
            phone: val.phone,
            credentials: val.credentialsRaw.split(',').map((c) => c.trim()).filter(Boolean),
            socialLinks: this.socialLinksList(),
            testimonials: this.testimonialsList(),
            googleReviewsUrl: val.googleReviewsUrl.trim() || undefined,
            bio: val.bio,
            aboutDetailed: val.aboutDetailed,
            emergencyNotice: val.emergencyNotice || undefined,
          })
        );
        this.saveSuccess.set(true);
        this.toast.showSuccess('Profile details saved!');
        setTimeout(() => this.saveSuccess.set(false), 3000);
      } catch (err: unknown) {
        const msg =
          (err as { error?: { error?: string } })?.error?.error || 'Failed to save profile details.';
        this.toast.showError(msg);
      } finally {
        this.toast.stopLoading();
      }
    });
  }
}
