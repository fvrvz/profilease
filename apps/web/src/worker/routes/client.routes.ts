import { Hono } from 'hono';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { appointments, availabilities, profiles, services } from '../db/schema';
import { formatProfileWithRelations } from '../db/profile.mapper';
import { validatePlanUpdate } from '../lib/plan-gating';
import { parseJson, type AppContext, type SocialLinkItem, type TestimonialItem } from '../types';

export const clientRoutes = new Hono<AppContext>();

clientRoutes.get('/me', async (c) => {
  const profileId = c.req.query('profileId');
  if (!profileId) {
    return c.json({ error: 'Missing profileId query parameter' }, 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const row = await db.select().from(profiles).where(eq(profiles.id, profileId)).get();
  if (!row) {
    return c.json({ error: 'Client profile not found' }, 404);
  }

  return c.json({ profile: await formatProfileWithRelations(row, db) });
});

clientRoutes.get('/appointments', async (c) => {
  const profileId = c.req.query('profileId');
  if (!profileId) {
    return c.json({ error: 'Missing profileId' }, 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.profileId, profileId))
    .orderBy(desc(appointments.createdAt))
    .all();

  return c.json(
    rows.map((r) => ({
      id: r.id,
      profileId: r.profileId,
      serviceId: r.serviceId,
      serviceTitle: r.serviceTitle,
      clientName: r.clientName,
      clientEmail: r.clientEmail,
      clientPhone: r.clientPhone,
      appointmentDate: r.appointmentDate,
      appointmentTime: r.appointmentTime,
      notes: r.notes || '',
      status: r.status,
      actionToken: r.actionToken,
      createdAt: r.createdAt,
    }))
  );
});

clientRoutes.patch('/appointments/:id/status', async (c) => {
  const id = c.req.param('id').trim();
  const body = await parseJson<{ status?: string }>(c.req.raw);
  const validStatuses = ['pending', 'confirmed', 'declined', 'cancelled', 'completed'];

  if (!body.status || !validStatuses.includes(body.status)) {
    return c.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      400
    );
  }

  const db = drizzle(c.env.DB, { schema });
  const current = await db.select().from(appointments).where(eq(appointments.id, id)).get();
  if (!current) {
    return c.json({ error: `Appointment '${id}' not found.` }, 404);
  }

  await db.update(appointments).set({ status: body.status }).where(eq(appointments.id, id));
  const updated = await db.select().from(appointments).where(eq(appointments.id, id)).get();

  return c.json({
    id: updated!.id,
    profileId: updated!.profileId,
    serviceId: updated!.serviceId,
    serviceTitle: updated!.serviceTitle,
    clientName: updated!.clientName,
    clientEmail: updated!.clientEmail,
    clientPhone: updated!.clientPhone,
    appointmentDate: updated!.appointmentDate,
    appointmentTime: updated!.appointmentTime,
    notes: updated!.notes || '',
    status: updated!.status,
    actionToken: updated!.actionToken,
    createdAt: updated!.createdAt,
  });
});

clientRoutes.put('/profile', async (c) => {
  const body = await parseJson<{
    id?: string;
    name?: string;
    title?: string;
    profession?: string;
    bio?: string;
    aboutDetailed?: string;
    avatarUrl?: string;
    phone?: string;
    customDomain?: string | null;
    location?: string;
    clinicOrSchoolName?: string;
    country?: string;
    currency?: string;
    timezone?: string;
    timingsNote?: string;
    serviceMode?: string;
    googleReviewsUrl?: string | null;
    theme?: string;
    layoutVariant?: string;
    viewMode?: string;
    borderStyle?: string;
    themeOverrides?: Record<string, string> | null;
    customCss?: string | null;
    hidePlatformBranding?: boolean;
    credentials?: string[];
    socialLinks?: SocialLinkItem[];
    testimonials?: TestimonialItem[];
    services?: Array<{
      id?: string;
      name?: string;
      title?: string;
      description?: string;
      durationMinutes?: number;
      price?: number;
      category?: string;
      tags?: string[];
      isActive?: boolean;
    }>;
    availability?: Array<{
      id?: string;
      day?: string;
      dayOfWeek?: string;
      enabled: boolean;
      startTime?: string;
      endTime?: string;
      slotDurationMinutes?: number;
    }>;
    emergencyNotice?: string | null;
  }>(c.req.raw);

  if (!body.id) {
    return c.json({ error: 'Missing profile ID in update body.' }, 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const current = await db.select().from(profiles).where(eq(profiles.id, body.id)).get();
  if (!current) {
    return c.json({ error: `Profile '${body.id}' not found.` }, 404);
  }

  const gatingError = validatePlanUpdate(current, body);
  if (gatingError) {
    return c.json({ error: gatingError }, 403);
  }

  await db
    .update(profiles)
    .set({
      name: body.name ?? current.name,
      title: body.title ?? current.title,
      profession: body.profession ?? current.profession,
      bio: body.bio ?? current.bio,
      aboutDetailed:
        body.aboutDetailed !== undefined
          ? body.aboutDetailed
          : (current.aboutDetailed ?? current.bio),
      avatarUrl: body.avatarUrl ?? current.avatarUrl,
      phone: body.phone ?? current.phone,
      customDomain:
        body.customDomain !== undefined ? body.customDomain?.trim() || null : current.customDomain,
      location: body.location !== undefined ? body.location : (current.location ?? ''),
      clinicOrSchoolName:
        body.clinicOrSchoolName !== undefined
          ? body.clinicOrSchoolName
          : (current.clinicOrSchoolName ?? ''),
      country: body.country ?? current.country,
      currency: body.currency ?? current.currency,
      timezone: body.timezone ?? current.timezone,
      timingsNote:
        body.timingsNote !== undefined ? body.timingsNote : (current.timingsNote ?? ''),
      serviceMode: body.serviceMode ?? current.serviceMode ?? 'clinic',
      theme: body.theme ?? current.theme,
      layoutVariant: body.layoutVariant ?? (current.layoutVariant || 'classic'),
      viewMode: body.viewMode ?? (current.viewMode || 'portfolio'),
      borderStyle:
        body.borderStyle === 'rounded' || body.borderStyle === 'sharp'
          ? body.borderStyle
          : (current.borderStyle || 'sharp'),
      themeOverridesJson:
        body.themeOverrides !== undefined
          ? JSON.stringify(body.themeOverrides)
          : (current.themeOverridesJson || null),
      customCss:
        body.customCss !== undefined ? body.customCss || null : (current.customCss || null),
      hidePlatformBranding:
        body.hidePlatformBranding !== undefined
          ? body.hidePlatformBranding
            ? 1
            : 0
          : (current.hidePlatformBranding || 0),
      emergencyNotice:
        body.emergencyNotice !== undefined
          ? body.emergencyNotice || null
          : (current.emergencyNotice ?? null),
      googleReviewsUrl:
        body.googleReviewsUrl !== undefined
          ? body.googleReviewsUrl?.trim() || null
          : (current.googleReviewsUrl ?? null),
      credentials: body.credentials ? JSON.stringify(body.credentials) : current.credentials,
      socialLinks: body.socialLinks
        ? JSON.stringify(body.socialLinks)
        : (current.socialLinks || null),
      testimonialsJson:
        body.testimonials !== undefined
          ? JSON.stringify(body.testimonials)
          : (current.testimonialsJson || null),
    })
    .where(eq(profiles.id, body.id));

  if (Array.isArray(body.services)) {
    await db.delete(services).where(eq(services.profileId, body.id));
    if (body.services.length > 0) {
      await db.insert(services).values(
        body.services.map((s) => ({
          id: s.id || `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          profileId: body.id!,
          name: s.title || s.name || 'Consultation',
          description: s.description || '',
          durationMinutes: s.durationMinutes || 30,
          price: s.price || 0,
          category: s.category || 'Consultation',
          tagsJson: JSON.stringify(s.tags || []),
          isActive: s.isActive !== false ? 1 : 0,
        }))
      );
    }
  }

  if (Array.isArray(body.availability)) {
    await db.delete(availabilities).where(eq(availabilities.profileId, body.id));
    if (body.availability.length > 0) {
      await db.insert(availabilities).values(
        body.availability.map((a) => {
          const rawDay = a.day || a.dayOfWeek || 'Monday';
          const dayStr = rawDay.charAt(0).toUpperCase() + rawDay.slice(1).toLowerCase();
          return {
            id: a.id || `avail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            profileId: body.id!,
            dayOfWeek: dayStr,
            enabled: a.enabled ? 1 : 0,
            startTime: a.startTime || '09:00',
            endTime: a.endTime || '17:00',
            slotDurationMinutes: a.slotDurationMinutes || 30,
          };
        })
      );
    }
  }

  const updatedRow = await db.select().from(profiles).where(eq(profiles.id, body.id)).get();
  if (!updatedRow) {
    return c.json({ error: 'Failed to retrieve updated profile' }, 500);
  }

  return c.json(await formatProfileWithRelations(updatedRow, db));
});
