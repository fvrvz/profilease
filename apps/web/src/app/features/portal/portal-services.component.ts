import { Component, computed, inject, signal } from '@angular/core';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ServiceItem, getPlanCapabilities } from '@profilease/types';
import { ClientAuthService } from '@service/client-auth.service';
import { ToastService } from '@service/toast.service';
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
  private readonly toast = inject(ToastService);

  readonly currentProfile = this.clientAuth.currentProfile;
  readonly showAddForm = signal<boolean>(false);
  readonly serviceError = signal<string | null>(null);
  readonly serviceLimit = computed<number>(() => {
    const profile = this.currentProfile();
    const caps = getPlanCapabilities(profile?.subscriptionPlan);
    return caps.baseServiceLimit + (profile?.extraServiceSlots || 0);
  });

  toggleAddForm(): void {
    this.serviceError.set(null);
    this.showAddForm.set(!this.showAddForm());
  }

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
    void submit(this.serviceForm, async () => {
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
      this.serviceError.set(null);
      this.toast.startLoading('Publishing service...');
      try {
        await firstValueFrom(this.clientAuth.updateProfile({ services: updatedServices }));
        this.showAddForm.set(false);
        this.newServiceState.set({
          title: '',
          description: '',
          category: 'Consultation',
          price: 150,
          durationMinutes: 45,
          tagsRaw: 'In-Person, Telehealth',
        });
        this.toast.showSuccess('Service added to your catalog!');
      } catch (err: unknown) {
        const msg =
          (err as { error?: { error?: string } })?.error?.error ||
          'Unable to add service. Please check your plan service quota.';
        this.serviceError.set(msg);
        this.toast.showError(msg);
      } finally {
        this.toast.stopLoading();
      }
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
