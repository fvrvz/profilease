import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { ServiceItem } from '@profilease/types';
import { ClientAuthService } from '@service/client-auth.service';
import { SharpButtonComponent } from '@shared/components/sharp-button.component';
import { SharpIconComponent } from '@shared/components/sharp-icon.component';

@Component({
  selector: 'app-portal-services',
  imports: [
    FormField,
    SharpButtonComponent,
    SharpIconComponent,
  ],
  templateUrl: './portal-services.component.html',
})
export class PortalServicesComponent {
  private readonly clientAuth = inject(ClientAuthService);

  readonly currentProfile = this.clientAuth.currentProfile;
  readonly showAddForm = signal<boolean>(false);

  readonly newServiceState = signal({
    title: '',
    description: '',
    category: 'Consultation',
    price: 150,
    durationMinutes: 45,
    tagsRaw: 'In-Person, Telehealth',
  });

  readonly serviceForm = form(this.newServiceState, (schema) => {
    required(schema.title, { message: 'Title is required' });
    required(schema.description, { message: 'Description is required' });
    required(schema.category, { message: 'Category is required' });
  });

  onAddService(event: Event): void {
    event.preventDefault();
    const val = this.newServiceState();
    if (!val.title || !val.description) return;

    const profile = this.currentProfile();
    if (!profile) return;

    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      title: val.title,
      description: val.description,
      category: val.category,
      price: Number(val.price) || 100,
      durationMinutes: Number(val.durationMinutes) || 30,
      tags: val.tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
    };

    const updatedServices = [...profile.services, newService];
    this.clientAuth.updateProfile({ services: updatedServices }).subscribe({
      next: () => {
        this.showAddForm.set(false);
        this.newServiceState.set({
          title: '',
          description: '',
          category: 'Consultation',
          price: 150,
          durationMinutes: 45,
          tagsRaw: 'In-Person, Telehealth',
        });
      },
    });
  }

  deleteService(serviceId: string): void {
    const profile = this.currentProfile();
    if (!profile) return;

    if (confirm('Are you sure you want to remove this service?')) {
      const updatedServices = profile.services.filter((s) => s.id !== serviceId);
      this.clientAuth.updateProfile({ services: updatedServices }).subscribe();
    }
  }
}
