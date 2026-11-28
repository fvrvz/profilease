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
  | 'warm-amber'
  | 'emerald-care'
  | 'crimson-bold';

export type SubscriptionPlan = 'basic' | 'mid' | 'pro';
export type LayoutVariant = 'classic' | 'split-sidebar' | 'compact-grid';
export type PortfolioViewMode = 'portfolio' | 'link-card' | 'editorial-magazine' | 'executive-dark';
export type BorderStyle = 'sharp' | 'rounded';
export type ColorPreference = 'light' | 'dark' | 'system';

export interface ThemeOverrides {
  readonly accentColor?: string;
  readonly backgroundColor?: string;
  readonly surfaceColor?: string;
  readonly textColor?: string;
  readonly fontStyle?: 'sans' | 'serif' | 'mono';
}

export interface PlanCapabilities {
  readonly plan: SubscriptionPlan;
  readonly label: string;
  readonly yearlyPriceUsd: number;
  readonly canSwitchThemeColors: boolean;
  readonly canSwitchLayouts: boolean;
  readonly allowedLayouts: readonly LayoutVariant[];
  readonly allowedViews: readonly PortfolioViewMode[];
  readonly canCustomizeCss: boolean;
  readonly canCustomizeColors: boolean;
  readonly canHideBranding: boolean;
  readonly baseServiceLimit: number;
  readonly maxTestimonials: number | null; // null = unlimited
  readonly includesCustomDomain: boolean;
  readonly canPurchaseCustomDomainAddon: boolean;
  readonly includesGoogleReviews: boolean;
  readonly includesWhatsappAlerts: boolean;
}

export const PLAN_CAPABILITIES: Record<SubscriptionPlan, PlanCapabilities> = {
  basic: {
    plan: 'basic',
    label: 'Basic',
    yearlyPriceUsd: 20,
    canSwitchThemeColors: true,
    canSwitchLayouts: false,
    allowedLayouts: ['classic'],
    allowedViews: ['portfolio'],
    canCustomizeCss: false,
    canCustomizeColors: false,
    canHideBranding: false,
    baseServiceLimit: 5,
    maxTestimonials: 3,
    includesCustomDomain: false,
    canPurchaseCustomDomainAddon: true,
    includesGoogleReviews: false,
    includesWhatsappAlerts: false,
  },
  mid: {
    plan: 'mid',
    label: 'Mid / Growth',
    yearlyPriceUsd: 89,
    canSwitchThemeColors: true,
    canSwitchLayouts: true,
    allowedLayouts: ['classic', 'split-sidebar', 'compact-grid'],
    allowedViews: ['portfolio', 'link-card'],
    canCustomizeCss: false,
    canCustomizeColors: false,
    canHideBranding: false,
    baseServiceLimit: 15,
    maxTestimonials: null,
    includesCustomDomain: true,
    canPurchaseCustomDomainAddon: false,
    includesGoogleReviews: true,
    includesWhatsappAlerts: true,
  },
  pro: {
    plan: 'pro',
    label: 'Pro White-Label',
    yearlyPriceUsd: 299,
    canSwitchThemeColors: true,
    canSwitchLayouts: true,
    allowedLayouts: ['classic', 'split-sidebar', 'compact-grid'],
    allowedViews: ['portfolio', 'link-card', 'editorial-magazine', 'executive-dark'],
    canCustomizeCss: true,
    canCustomizeColors: true,
    canHideBranding: true,
    baseServiceLimit: 999,
    maxTestimonials: null,
    includesCustomDomain: true,
    canPurchaseCustomDomainAddon: false,
    includesGoogleReviews: true,
    includesWhatsappAlerts: true,
  },
};

export function normalizePlan(plan?: string | null): SubscriptionPlan {
  if (plan === 'mid' || plan === 'pro' || plan === 'basic') {
    return plan;
  }
  return 'basic';
}

export function getPlanCapabilities(plan?: string | null): PlanCapabilities {
  return PLAN_CAPABILITIES[normalizePlan(plan)];
}

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

export type ServiceMode = 'clinic' | 'home-visit' | 'online' | 'hybrid';

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
  readonly serviceMode?: ServiceMode;
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
  readonly subscriptionPlan?: SubscriptionPlan;
  readonly subscriptionStatus?: string;
  readonly layoutVariant?: LayoutVariant;
  readonly viewMode?: PortfolioViewMode;
  readonly borderStyle?: BorderStyle;
  readonly themeOverrides?: ThemeOverrides;
  readonly customCss?: string;
  readonly hidePlatformBranding?: boolean;
  readonly customDomainAddon?: boolean;
  readonly extraServiceSlots?: number;
  readonly services: readonly ServiceItem[];
  readonly availability: readonly DayAvailability[];
  readonly testimonials: readonly Testimonial[];
  readonly googleReviewsUrl?: string;
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
  readonly serviceMode?: ServiceMode;
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
  readonly subscriptionPlan?: SubscriptionPlan;
  readonly subscriptionStatus?: string;
  readonly layoutVariant?: LayoutVariant;
  readonly viewMode?: PortfolioViewMode;
  readonly borderStyle?: BorderStyle;
  readonly themeOverrides?: ThemeOverrides;
  readonly customCss?: string;
  readonly hidePlatformBranding?: boolean;
  readonly customDomainAddon?: boolean;
  readonly extraServiceSlots?: number;
  readonly services: readonly ServiceItem[];
  readonly availability: readonly DayAvailability[];
  readonly testimonials: readonly Testimonial[];
  readonly googleReviewsUrl?: string;
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
