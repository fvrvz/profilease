import { and, eq } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { availabilities, services, type ProfileRecord } from './schema';
import type * as schema from './schema';
import type { SocialLinkItem, TestimonialItem } from '../types';

const DAY_ORDER: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function formatProfileWithRelations(
  row: ProfileRecord,
  db: DrizzleD1Database<typeof schema>
) {
  const [servicesRes, availRes] = await Promise.all([
    db
      .select()
      .from(services)
      .where(and(eq(services.profileId, row.id), eq(services.isActive, 1))),
    db.select().from(availabilities).where(eq(availabilities.profileId, row.id)),
  ]);

  const credentials = safeJsonParse<string[]>(row.credentials, []);
  const socialLinks = safeJsonParse<SocialLinkItem[]>(row.socialLinks, []);
  const testimonials = safeJsonParse<TestimonialItem[]>(row.testimonialsJson, []);
  const themeOverrides = safeJsonParse<Record<string, string> | undefined>(
    row.themeOverridesJson,
    undefined
  );

  const formattedAvailability = availRes
    .map((a) => {
      const rawDay = a.dayOfWeek || '';
      const capitalized = rawDay
        ? rawDay.charAt(0).toUpperCase() + rawDay.slice(1).toLowerCase()
        : 'Monday';
      return {
        id: a.id,
        day: capitalized,
        dayOfWeek: capitalized,
        enabled: a.enabled === 1,
        startTime: a.startTime || '09:00',
        endTime: a.endTime || '17:00',
        slotDurationMinutes: a.slotDurationMinutes || 30,
      };
    })
    .sort((a, b) => (DAY_ORDER[a.day] || 99) - (DAY_ORDER[b.day] || 99));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    profession: row.profession,
    title: row.title,
    bio: row.bio,
    aboutDetailed: row.aboutDetailed || row.bio,
    avatarUrl: row.avatarUrl,
    theme: row.theme,
    subscriptionPlan:
      row.subscriptionPlan === 'mid' || row.subscriptionPlan === 'pro'
        ? row.subscriptionPlan
        : 'basic',
    subscriptionStatus: row.subscriptionStatus || 'active',
    layoutVariant: row.layoutVariant || 'classic',
    viewMode: row.viewMode || 'portfolio',
    borderStyle: row.borderStyle === 'rounded' ? 'rounded' : 'sharp',
    themeOverrides,
    customCss: row.customCss || undefined,
    hidePlatformBranding: Boolean(row.hidePlatformBranding),
    customDomainAddon: Boolean(row.customDomainAddon),
    extraServiceSlots: row.extraServiceSlots || 0,
    customDomain: row.customDomain,
    mustChangePassword: Boolean(row.mustChangePassword),
    email: row.email,
    phone: row.phone,
    city: row.city || '',
    country: row.country,
    currency: row.currency,
    timezone: row.timezone,
    location: row.location || row.country || 'Global / Online',
    serviceMode: row.serviceMode || 'clinic',
    clinicOrSchoolName:
      row.clinicOrSchoolName ||
      (row.profession === 'doctor' ? 'Specialist Care Clinic' : `${row.name}'s Practice`),
    timingsNote: row.timingsNote || 'Available during practice hours',
    emergencyNotice: row.emergencyNotice || undefined,
    googleReviewsUrl: row.googleReviewsUrl || undefined,
    isPublished: true,
    credentials,
    socialLinks,
    services: servicesRes.map((s) => ({
      id: s.id,
      title: s.name,
      name: s.name,
      description: s.description,
      durationMinutes: s.durationMinutes,
      price: s.price,
      category: s.category || (s.durationMinutes >= 60 ? 'Comprehensive' : 'Standard Session'),
      tags: safeJsonParse<string[]>(s.tagsJson, []),
      isActive: s.isActive === 1,
    })),
    availability: formattedAvailability,
    testimonials,
  };
}
