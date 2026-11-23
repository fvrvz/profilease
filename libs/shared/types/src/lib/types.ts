export type ProfessionType =
  | 'doctor'
  | 'teacher'
  | 'therapist'
  | 'coach'
  | 'consultant';

export type ThemeVariant =
  | 'medical-teal'
  | 'academic-indigo'
  | 'editorial-obsidian'
  | 'warm-amber';

export interface ServiceItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly price: number;
  readonly durationMinutes: number;
  readonly category: string;
  readonly tags: readonly string[];
}

export interface DayAvailability {
  readonly day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  readonly enabled: boolean;
  readonly startTime: string; // HH:mm format e.g. "09:00"
  readonly endTime: string;   // HH:mm format e.g. "17:00"
  readonly slotDurationMinutes: number;
}

export interface SocialLink {
  readonly platform: 'linkedin' | 'twitter' | 'github' | 'instagram' | 'website';
  readonly url: string;
}

export interface Testimonial {
  readonly id: string;
  readonly clientName: string;
  readonly roleOrCondition: string;
  readonly comment: string;
  readonly rating: number;
  readonly date: string;
}

export interface UserProfile {
  readonly id: string;
  readonly slug: string;
  readonly customDomain?: string;
  readonly name: string;
  readonly profession: ProfessionType;
  readonly title: string;
  readonly credentials: readonly string[];
  readonly bio: string;
  readonly aboutDetailed: string;
  readonly avatarUrl: string;
  readonly location: string;
  readonly clinicOrSchoolName: string;
  readonly email: string;
  readonly phone: string;
  readonly emergencyNotice?: string;
  readonly theme: ThemeVariant;
  readonly services: readonly ServiceItem[];
  readonly availability: readonly DayAvailability[];
  readonly testimonials: readonly Testimonial[];
  readonly socialLinks: readonly SocialLink[];
  readonly isPublished: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface AppointmentBooking {
  readonly id: string;
  readonly profileId: string;
  readonly serviceId: string;
  readonly serviceTitle: string;
  readonly clientName: string;
  readonly clientEmail: string;
  readonly clientPhone: string;
  readonly appointmentDate: string; // YYYY-MM-DD
  readonly appointmentTime: string; // HH:mm
  readonly notes: string;
  readonly status: AppointmentStatus;
  readonly createdAt: string;
}

export interface CreateProfileDto {
  readonly slug: string;
  readonly customDomain?: string;
  readonly name: string;
  readonly profession: ProfessionType;
  readonly title: string;
  readonly credentials: readonly string[];
  readonly bio: string;
  readonly aboutDetailed: string;
  readonly avatarUrl: string;
  readonly location: string;
  readonly clinicOrSchoolName: string;
  readonly email: string;
  readonly phone: string;
  readonly emergencyNotice?: string;
  readonly theme: ThemeVariant;
  readonly services: readonly ServiceItem[];
  readonly availability: readonly DayAvailability[];
  readonly testimonials: readonly Testimonial[];
  readonly socialLinks: readonly SocialLink[];
  readonly isPublished: boolean;
}

export interface UpdateProfileDto extends Partial<CreateProfileDto> {
  readonly id: string;
}

export interface CreateAppointmentDto {
  readonly profileId: string;
  readonly serviceId: string;
  readonly clientName: string;
  readonly clientEmail: string;
  readonly clientPhone: string;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
  readonly notes: string;
}

export interface AdminLoginDto {
  readonly email: string;
  readonly password: string;
}

export interface AdminAuthResponse {
  readonly success: boolean;
  readonly token: string;
  readonly username: string;
}

export interface DomainResolutionResponse {
  readonly matched: boolean;
  readonly profile?: UserProfile;
}
