import { Component, inject, signal, OnInit } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ClientAuthService } from '@service/client-auth.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';

@Component({
  selector: 'app-portal-profile',
  imports: [
    FormField,
    SharpButtonComponent,
  ],
  templateUrl: './portal-profile.component.html',
})
export class PortalProfileComponent implements OnInit {
  private readonly clientAuth = inject(ClientAuthService);

  readonly currentProfile = this.clientAuth.currentProfile;
  readonly saveSuccess = signal<boolean>(false);

  readonly profileState = signal({
    name: '',
    title: '',
    clinicOrSchoolName: '',
    location: '',
    phone: '',
    credentialsRaw: '',
    bio: '',
    aboutDetailed: '',
    emergencyNotice: '',
  });

  readonly profileForm = form(this.profileState, (schema) => {
    required(schema.name, { message: 'Name is required' });
    required(schema.title, { message: 'Title is required' });
    required(schema.bio, { message: 'Bio is required' });
  });

  ngOnInit(): void {
    const p = this.currentProfile();
    if (p) {
      this.profileState.set({
        name: p.name,
        title: p.title,
        clinicOrSchoolName: p.clinicOrSchoolName,
        location: p.location,
        phone: p.phone,
        credentialsRaw: (p.credentials || []).join(', '),
        bio: p.bio,
        aboutDetailed: p.aboutDetailed,
        emergencyNotice: p.emergencyNotice || '',
      });
    }
  }

  onSaveProfile(event: Event): void {
    event.preventDefault();
    const val = this.profileState();
    if (!val.name || !val.title || !val.bio) return;

    this.clientAuth
      .updateProfile({
        name: val.name,
        title: val.title,
        clinicOrSchoolName: val.clinicOrSchoolName,
        location: val.location,
        phone: val.phone,
        credentials: val.credentialsRaw.split(',').map((c) => c.trim()).filter(Boolean),
        bio: val.bio,
        aboutDetailed: val.aboutDetailed,
        emergencyNotice: val.emergencyNotice || undefined,
      })
      .subscribe({
        next: () => {
          this.saveSuccess.set(true);
          setTimeout(() => this.saveSuccess.set(false), 3000);
        },
      });
  }
}
