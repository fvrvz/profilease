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
  template: `
    <div class="space-y-8 font-sans">
      <!-- Title Header -->
      <div class="border-b-2 border-neutral-900 pb-4">
        <span class="text-xs font-mono uppercase tracking-widest text-neutral-500 block">Practitioner Identity</span>
        <h1 class="text-2xl font-black uppercase tracking-tight text-neutral-900">
          Profile Details & Branding
        </h1>
        <p class="text-xs text-neutral-600 mt-1 font-mono">
          Updates here reflect immediately on your live public portfolio site.
        </p>
      </div>

      <!-- Profile Signal Form -->
      <div class="bg-white border-2 border-neutral-900 p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <form (submit)="onSaveProfile($event)" novalidate class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Full Name -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Full Name & Title Suffix *
              </label>
              <input
                type="text"
                [formField]="profileForm.name"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              />
            </div>

            <!-- Professional Headline / Title -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Professional Headline *
              </label>
              <input
                type="text"
                [formField]="profileForm.title"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Clinic / School Name -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Clinic, Practice, or Department Name
              </label>
              <input
                type="text"
                [formField]="profileForm.clinicOrSchoolName"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              />
            </div>

            <!-- Location / Address -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Office / Consultation Address
              </label>
              <input
                type="text"
                [formField]="profileForm.location"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Phone -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Direct Contact Phone *
              </label>
              <input
                type="tel"
                [formField]="profileForm.phone"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              />
            </div>

            <!-- Credentials -->
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
                Degrees & Accreditations (Comma separated)
              </label>
              <input
                type="text"
                [formField]="profileForm.credentialsRaw"
                class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
              />
            </div>
          </div>

          <!-- Short Bio -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
              Brief Bio (Hero summary) *
            </label>
            <textarea
              [formField]="profileForm.bio"
              rows="3"
              class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
            ></textarea>
          </div>

          <!-- Detailed About -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
              Detailed Clinical / Academic Background
            </label>
            <textarea
              [formField]="profileForm.aboutDetailed"
              rows="5"
              class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
            ></textarea>
          </div>

          <!-- Emergency Notice -->
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-neutral-800 mb-1">
              Emergency Notice / Disclaimer (Optional)
            </label>
            <input
              type="text"
              [formField]="profileForm.emergencyNotice"
              class="w-full px-3 py-2 border-2 border-neutral-900 bg-white text-sm font-mono focus:outline-none"
            />
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-neutral-200">
            @if (saveSuccess()) {
              <span class="text-xs font-mono font-bold text-emerald-600">
                ✓ Profile saved and published live!
              </span>
            } @else {
              <span></span>
            }

            <app-sharp-button type="submit" variant="primary">
              Save Profile Changes
            </app-sharp-button>
          </div>
        </form>
      </div>
    </div>
  `,
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
