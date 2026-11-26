export type KnownProfession =
  | 'doctor'
  | 'nurse'
  | 'engineer'
  | 'developer'
  | 'teacher'
  | 'student'
  | 'therapist'
  | 'coach'
  | 'consultant'
  | 'designer'
  | 'lawyer'
  | 'accountant'
  | 'creator'
  | 'artist'
  | 'writer'
  | 'researcher'
  | 'architect'
  | 'marketer'
  | 'other';

export type ProfessionType = KnownProfession | (string & {});

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

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface DayAvailability {
  readonly day: WeekDay;
  readonly enabled: boolean;
  readonly startTime: string; // HH:mm format e.g. "09:00"
  readonly endTime: string;   // HH:mm format e.g. "17:00"
  readonly slotDurationMinutes: number;
}

export type SocialPlatform =
  | 'linkedin'
  | 'twitter'
  | 'github'
  | 'instagram'
  | 'youtube'
  | 'website'
  | 'facebook'
  | 'tiktok'
  | 'threads'
  | 'discord'
  | 'email'
  | (string & {});

export interface SocialLink {
  readonly platform: SocialPlatform;
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
  readonly country: string;
  readonly currency: string;
  readonly timezone: string;
  readonly timingsNote?: string;
  readonly clientAccessKey?: string; // used for client portal login
  readonly mustChangePassword?: boolean;
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

export type AppointmentStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'completed';

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
  readonly actionToken: string; // Direct 1-click action token for email / WhatsApp
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
  readonly country?: string;
  readonly currency?: string;
  readonly timezone?: string;
  readonly timingsNote?: string;
  readonly clientAccessKey?: string;
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

export interface ClientLoginDto {
  readonly email: string;
  readonly accessKey: string;
}

export interface ClientAuthResponse {
  readonly success: boolean;
  readonly token: string;
  readonly profile: UserProfile;
}

export interface DomainResolutionResponse {
  readonly matched: boolean;
  readonly profile?: UserProfile;
}

export type NotificationChannel = 'email' | 'whatsapp';

export interface AppointmentNotificationMessage {
  readonly eventId: string;
  readonly eventType: 'appointment.created' | 'appointment.confirmed' | 'appointment.declined' | 'appointment.cancelled';
  readonly appointmentId: string;
  readonly profileId: string;
  readonly clientName: string;
  readonly clientEmail: string;
  readonly clientPhone: string;
  readonly professionalName: string;
  readonly professionalEmail: string;
  readonly professionalPhone: string;
  readonly serviceTitle: string;
  readonly appointmentDate: string;
  readonly appointmentTime: string;
  readonly notes: string;
  readonly actionToken: string;
  readonly acceptUrl: string;
  readonly declineUrl: string;
  readonly channels: readonly NotificationChannel[];
  readonly sentAt: string;
}

export interface NotificationDeliveryResult {
  readonly channel: NotificationChannel;
  readonly recipient: string;
  readonly status: 'delivered' | 'failed' | 'simulated';
  readonly messageId: string;
  readonly timestamp: string;
  readonly details?: string;
}
