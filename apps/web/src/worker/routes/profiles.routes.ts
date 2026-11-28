import { Hono } from 'hono';
import { desc, eq, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { availabilities, profiles, services } from '../db/schema';
import { formatProfileWithRelations } from '../db/profile.mapper';
import { hashPassword } from '../lib/crypto';
import { dispatchOnboardingNotifications } from '../services/email.service';
import { parseJson, type AppContext, type SocialLinkItem, type TestimonialItem } from '../types';

export const profilesRoutes = new Hono<AppContext>();

profilesRoutes.get('/resolve-domain', async (c) => {
  const host = (c.req.query('host') || '').toLowerCase().trim().replace(/:\d+$/, '');
  if (!host) {
    return c.json({ matched: false });
  }

  const db = drizzle(c.env.DB, { schema });
  const row = await db
    .select()
    .from(profiles)
    .where(sql`LOWER(${profiles.customDomain}) = ${host}`)
    .get();

  if (!row) {
    return c.json({ matched: false });
  }

  const profile = await formatProfileWithRelations(row, db);
  return c.json({ matched: true, profile });
});

profilesRoutes.get('/profiles', async (c) => {
  const db = drizzle(c.env.DB, { schema });
  const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt)).all();
  const formatted = await Promise.all(rows.map((r) => formatProfileWithRelations(r, db)));
  return c.json(formatted);
});

profilesRoutes.get('/profiles/:idOrSlug', async (c) => {
  const idOrSlug = c.req.param('idOrSlug').trim();
  const db = drizzle(c.env.DB, { schema });

  const row = await db
    .select()
    .from(profiles)
    .where(or(eq(profiles.id, idOrSlug), eq(profiles.slug, idOrSlug)))
    .get();

  if (!row) {
    return c.json({ error: `Profile '${idOrSlug}' not found` }, 404);
  }

  const profile = await formatProfileWithRelations(row, db);
  return c.json(profile);
});

profilesRoutes.post('/profiles', async (c) => {
  const body = await parseJson<{
    id?: string;
    slug?: string;
    name?: string;
    profession?: string;
    title?: string;
    bio?: string;
    aboutDetailed?: string;
    avatarUrl?: string;
    location?: string;
    clinicOrSchoolName?: string;
    timingsNote?: string;
    emergencyNotice?: string;
    serviceMode?: string;
    googleReviewsUrl?: string;
    subscriptionPlan?: string;
    layoutVariant?: string;
    viewMode?: string;
    borderStyle?: string;
    customDomainAddon?: boolean;
    extraServiceSlots?: number;
    theme?: string;
    customDomain?: string | null;
    clientAccessKey?: string;
    email?: string;
    phone?: string;
    country?: string;
    currency?: string;
    timezone?: string;
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
  }>(c.req.raw);

  if (!body.name || !body.slug || !body.profession) {
    return c.json({ error: 'Missing required profile fields (name, slug, profession)' }, 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const existing = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.slug, body.slug)).get();
  if (existing) {
    return c.json({ error: `A profile with slug '${body.slug}' already exists.` }, 409);
  }

  const id = body.id || `prof-${Date.now()}`;
  const clientAccessKey =
    body.clientAccessKey ||
    `Tmp-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6)}`;
  const hashedAccessKey = await hashPassword(clientAccessKey);
  const origin = new URL(c.req.url).origin;

  await db.insert(profiles).values({
    id,
    slug: body.slug,
    name: body.name,
    profession: body.profession,
    title: body.title || '',
    bio: body.bio || '',
    aboutDetailed: body.aboutDetailed || body.bio || '',
    avatarUrl: body.avatarUrl || '',
    theme: body.theme || 'medical-teal',
    customDomain: body.customDomain || null,
    clientAccessKey: hashedAccessKey,
    mustChangePassword: 1,
    email: body.email || '',
    phone: body.phone || '',
    country: body.country || 'United States',
    currency: body.currency || 'USD',
    timezone: body.timezone || 'UTC',
    credentials: JSON.stringify(body.credentials || []),
    socialLinks: JSON.stringify(body.socialLinks || []),
    location: body.location || '',
    clinicOrSchoolName: body.clinicOrSchoolName || `${body.name}'s Practice`,
    timingsNote: body.timingsNote || '',
    emergencyNotice: body.emergencyNotice || null,
    serviceMode: body.serviceMode || 'clinic',
    testimonialsJson: JSON.stringify(body.testimonials || []),
    googleReviewsUrl: body.googleReviewsUrl || null,
    subscriptionPlan: body.subscriptionPlan || 'basic',
    subscriptionStatus: 'active',
    layoutVariant: body.layoutVariant || 'classic',
    viewMode: body.viewMode || 'portfolio',
    borderStyle: body.borderStyle || 'sharp',
    customDomainAddon: body.customDomainAddon ? 1 : 0,
    extraServiceSlots: Number(body.extraServiceSlots || 0),
  });

  if (Array.isArray(body.services) && body.services.length > 0) {
    await db.insert(services).values(
      body.services.map((s) => ({
        id: s.id || `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        profileId: id,
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

  if (Array.isArray(body.availability) && body.availability.length > 0) {
    await db.insert(availabilities).values(
      body.availability.map((a) => {
        const rawDay = a.day || a.dayOfWeek || 'Monday';
        const dayStr = rawDay.charAt(0).toUpperCase() + rawDay.slice(1).toLowerCase();
        return {
          id: a.id || `avail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          profileId: id,
          dayOfWeek: dayStr,
          enabled: a.enabled ? 1 : 0,
          startTime: a.startTime || '09:00',
          endTime: a.endTime || '17:00',
          slotDurationMinutes: a.slotDurationMinutes || 30,
        };
      })
    );
  }

  const createdRow = await db.select().from(profiles).where(eq(profiles.id, id)).get();
  if (!createdRow) {
    return c.json({ error: 'Failed to create profile' }, 500);
  }

  const createdProfile = await formatProfileWithRelations(createdRow, db);
  c.executionCtx.waitUntil(
    dispatchOnboardingNotifications({
      env: c.env,
      origin,
      name: body.name,
      email: body.email || '',
      phone: body.phone || '',
      slug: body.slug,
      customDomain: body.customDomain || null,
      tempPassword: clientAccessKey,
    })
  );

  return c.json(createdProfile, 201);
});

profilesRoutes.put('/profiles/:id', async (c) => {
  const id = c.req.param('id').trim();
  const body = await parseJson<{
    name?: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    phone?: string;
    theme?: string;
    customDomain?: string | null;
    country?: string;
    currency?: string;
    timezone?: string;
    credentials?: string[];
    socialLinks?: SocialLinkItem[];
    subscriptionPlan?: string;
    customDomainAddon?: boolean;
    extraServiceSlots?: number;
  }>(c.req.raw);

  const db = drizzle(c.env.DB, { schema });
  const current = await db.select().from(profiles).where(eq(profiles.id, id)).get();
  if (!current) {
    return c.json({ error: `Profile with ID '${id}' not found.` }, 404);
  }

  await db
    .update(profiles)
    .set({
      name: body.name ?? current.name,
      title: body.title ?? current.title,
      bio: body.bio ?? current.bio,
      avatarUrl: body.avatarUrl ?? current.avatarUrl,
      phone: body.phone ?? current.phone,
      theme: body.theme ?? current.theme,
      customDomain: body.customDomain !== undefined ? body.customDomain : current.customDomain,
      country: body.country ?? current.country,
      currency: body.currency ?? current.currency,
      timezone: body.timezone ?? current.timezone,
      credentials: body.credentials !== undefined ? JSON.stringify(body.credentials) : current.credentials,
      socialLinks: body.socialLinks !== undefined ? JSON.stringify(body.socialLinks) : current.socialLinks,
      subscriptionPlan: body.subscriptionPlan ?? (current.subscriptionPlan || 'basic'),
      customDomainAddon:
        body.customDomainAddon !== undefined ? (body.customDomainAddon ? 1 : 0) : (current.customDomainAddon || 0),
      extraServiceSlots:
        body.extraServiceSlots !== undefined ? body.extraServiceSlots : (current.extraServiceSlots || 0),
    })
    .where(eq(profiles.id, id));

  const updatedRow = await db.select().from(profiles).where(eq(profiles.id, id)).get();
  if (!updatedRow) {
    return c.json({ error: 'Profile not found after update.' }, 404);
  }
  return c.json(await formatProfileWithRelations(updatedRow, db));
});

profilesRoutes.delete('/profiles/:id', async (c) => {
  const id = c.req.param('id').trim();
  const db = drizzle(c.env.DB, { schema });
  const current = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, id)).get();
  if (!current) {
    return c.json({ error: `Profile with ID '${id}' not found.` }, 404);
  }

  await db.delete(profiles).where(eq(profiles.id, id));
  return c.json({ success: true, message: `Profile '${id}' deleted.` });
});
