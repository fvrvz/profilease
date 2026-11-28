import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  profession: text('profession').notNull(),
  title: text('title').notNull(),
  bio: text('bio').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  theme: text('theme').notNull(),
  customDomain: text('custom_domain').unique(),
  clientAccessKey: text('client_access_key').notNull(),
  mustChangePassword: integer('must_change_password').notNull().default(0),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  city: text('city').default(''),
  country: text('country').notNull(),
  currency: text('currency').notNull(),
  timezone: text('timezone').notNull(),
  credentials: text('credentials'),
  socialLinks: text('social_links'),
  location: text('location'),
  clinicOrSchoolName: text('clinic_or_school_name'),
  aboutDetailed: text('about_detailed'),
  timingsNote: text('timings_note'),
  emergencyNotice: text('emergency_notice'),
  serviceMode: text('service_mode').notNull().default('clinic'),
  testimonialsJson: text('testimonials_json'),
  googleReviewsUrl: text('google_reviews_url'),
  subscriptionPlan: text('subscription_plan').default('basic'),
  subscriptionStatus: text('subscription_status').default('active'),
  layoutVariant: text('layout_variant').notNull().default('classic'),
  viewMode: text('view_mode').notNull().default('portfolio'),
  borderStyle: text('border_style').notNull().default('sharp'),
  themeOverridesJson: text('theme_overrides_json'),
  customCss: text('custom_css'),
  hidePlatformBranding: integer('hide_platform_branding').notNull().default(0),
  customDomainAddon: integer('custom_domain_addon').notNull().default(0),
  extraServiceSlots: integer('extra_service_slots').notNull().default(0),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpiresAt: text('password_reset_expires_at'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  price: real('price').notNull(),
  category: text('category').notNull().default('Consultation'),
  tagsJson: text('tags_json'),
  isActive: integer('is_active').notNull().default(1),
});

export const availabilities = sqliteTable('availabilities', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  dayOfWeek: text('day_of_week').notNull(),
  enabled: integer('enabled').notNull().default(1),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  slotDurationMinutes: integer('slot_duration_minutes').notNull().default(30),
});

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  profileId: text('profile_id')
    .notNull()
    .references(() => profiles.id, { onDelete: 'cascade' }),
  serviceId: text('service_id').notNull(),
  serviceTitle: text('service_title').notNull(),
  clientName: text('client_name').notNull(),
  clientEmail: text('client_email').notNull(),
  clientPhone: text('client_phone').notNull(),
  appointmentDate: text('appointment_date').notNull(),
  appointmentTime: text('appointment_time').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  actionToken: text('action_token').notNull().unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export type ProfileRecord = typeof profiles.$inferSelect;
export type ServiceRecord = typeof services.$inferSelect;
export type AvailabilityRecord = typeof availabilities.$inferSelect;
export type AppointmentRecord = typeof appointments.$inferSelect;
