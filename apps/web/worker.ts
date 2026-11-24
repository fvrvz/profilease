/// <reference types="@cloudflare/workers-types" />
import { Resend } from 'resend';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  NODE_ENV?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  // Tigris S3-compatible storage credentials (set as Worker secrets)
  TIGRIS_ACCESS_KEY_ID?: string;
  TIGRIS_SECRET_ACCESS_KEY?: string;
  TIGRIS_ENDPOINT?: string;
  TIGRIS_BUCKET?: string;
  TIGRIS_REGION?: string;
}

const mediaCacheWorker = new Map<string, { buffer: Uint8Array; mimeType: string }>();

interface ProfileRow {
  id: string;
  slug: string;
  name: string;
  profession: string;
  title: string;
  bio: string;
  avatar_url: string;
  theme: string;
  custom_domain: string | null;
  client_access_key: string;
  email: string;
  phone: string;
  country: string;
  currency: string;
  timezone: string;
  credentials: string | null;
  social_links?: string | null;
}

interface ServiceRow {
  id: string;
  profile_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: number;
}

interface AvailabilityRow {
  id: string;
  profile_id: string;
  day_of_week: string;
  enabled: number;
  start_time: string;
  end_time: string;
}

interface AppointmentRow {
  id: string;
  profile_id: string;
  service_id: string;
  service_title: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_date: string;
  appointment_time: string;
  notes: string | null;
  status: string;
  action_token: string;
  created_at: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || url.hostname;
    const cleanHost = host.split(':')[0].toLowerCase();

    // 1. CORS Pre-flight for API calls
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api')) {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 2. REST API Endpoints backed by Cloudflare D1
    if (url.pathname.startsWith('/api')) {
      const response = await handleApi(request, url, env, ctx);
      // Append CORS headers
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    // 3. Multi-Tenant Custom Domain Resolution on Root Path
    // If accessing via custom domain (e.g. drelenavance.com), check D1 for matching profile
    if (
      cleanHost &&
      !cleanHost.includes('workers.dev') &&
      !cleanHost.includes('pages.dev') &&
      cleanHost !== 'localhost' &&
      cleanHost !== '127.0.0.1' &&
      url.pathname === '/'
    ) {
      const row = await env.DB.prepare('SELECT slug FROM profiles WHERE LOWER(custom_domain) = ?')
        .bind(cleanHost)
        .first<{ slug: string }>();

      if (row?.slug) {
        // Rewrite internally to the practitioner's portfolio route
        const rewrittenUrl = new URL(`/@${row.slug}`, url.origin);
        return env.ASSETS.fetch(new Request(rewrittenUrl.toString(), request));
      }
    }

    // 4. Static Asset and SPA Fallback via ASSETS binding
    try {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    } catch {
      // Asset not found, continue to SPA fallback
    }

    // SPA Fallback: Serve index.html or index.csr.html for Angular client-side routing
    try {
      const spaIndex = await env.ASSETS.fetch(new Request(new URL('/index.html', url.origin).toString(), request));
      if (spaIndex.status !== 404) {
        return spaIndex;
      }
    } catch {
      // Fall through to index.csr.html
    }

    return env.ASSETS.fetch(new Request(new URL('/index.csr.html', url.origin).toString(), request));
  },
};

async function handleApi(request: Request, url: URL, env: Env, ctx: ExecutionContext): Promise<Response> {
  const path = url.pathname;
  const method = request.method;

  // --- GET /api/profiles ---
  if (path === '/api/profiles' && method === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM profiles ORDER BY created_at DESC').all<ProfileRow>();
    const profiles = await Promise.all(
      results.map(async (row) => formatProfileWithRelations(row, env.DB))
    );
    return Response.json(profiles);
  }

  // --- GET /api/profiles/:idOrSlug ---
  if (path.startsWith('/api/profiles/') && method === 'GET') {
    const idOrSlug = path.replace('/api/profiles/', '').trim();
    const row = await env.DB.prepare('SELECT * FROM profiles WHERE id = ? OR slug = ?')
      .bind(idOrSlug, idOrSlug)
      .first<ProfileRow>();

    if (!row) {
      return Response.json({ error: `Profile '${idOrSlug}' not found` }, { status: 404 });
    }

    const profile = await formatProfileWithRelations(row, env.DB);
    return Response.json(profile);
  }

  // --- POST /api/profiles (Admin onboard client profile) ---
  if (path === '/api/profiles' && method === 'POST') {
    const body = await request.json<{
      id?: string;
      slug?: string;
      name?: string;
      profession?: string;
      title?: string;
      bio?: string;
      avatarUrl?: string;
      theme?: string;
      customDomain?: string | null;
      clientAccessKey?: string;
      email?: string;
      phone?: string;
      country?: string;
      currency?: string;
      timezone?: string;
      credentials?: string[];
      socialLinks?: Array<{ platform: string; url: string }>;
      services?: Array<{ id?: string; name: string; description?: string; durationMinutes?: number; price?: number; isActive?: boolean }>;
      availability?: Array<{ id?: string; dayOfWeek: string; enabled: boolean; startTime?: string; endTime?: string }>;
    }>().catch(() => ({}));

    if (!body || !body.name || !body.slug || !body.profession) {
      return Response.json({ error: 'Missing required profile fields (name, slug, profession)' }, { status: 400 });
    }

    const existing = await env.DB.prepare('SELECT id FROM profiles WHERE slug = ?').bind(body.slug).first();
    if (existing) {
      return Response.json({ error: `A profile with slug '${body.slug}' already exists.` }, { status: 409 });
    }

    const id = body.id || `prof-${Date.now()}`;
    const slug = body.slug;
    const name = body.name;
    const profession = body.profession;
    const title = body.title || '';
    const bio = body.bio || '';
    const avatarUrl = body.avatarUrl || '';
    const theme = body.theme || 'medical-teal';
    const customDomain = body.customDomain || null;
    const clientAccessKey = body.clientAccessKey || Math.random().toString(36).substring(2, 10);
    const email = body.email || '';
    const phone = body.phone || '';
    const country = body.country || 'United States';
    const currency = body.currency || 'USD';
    const timezone = body.timezone || 'UTC';
    const credentials = JSON.stringify(body.credentials || []);
    const socialLinks = JSON.stringify(body.socialLinks || []);

    await env.DB.prepare(`
      INSERT INTO profiles (id, slug, name, profession, title, bio, avatar_url, theme, custom_domain, client_access_key, email, phone, country, currency, timezone, credentials, social_links)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, slug, name, profession, title, bio, avatarUrl, theme, customDomain, clientAccessKey, email, phone, country, currency, timezone, credentials, socialLinks).run();

    if (Array.isArray(body.services)) {
      for (const s of body.services) {
        const sId = s.id || `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await env.DB.prepare(`
          INSERT INTO services (id, profile_id, name, description, duration_minutes, price, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(sId, id, s.name, s.description || '', s.durationMinutes || 30, s.price || 0, s.isActive !== false ? 1 : 0).run();
      }
    }

    if (Array.isArray(body.availability)) {
      for (const a of body.availability) {
        const aId = a.id || `avail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await env.DB.prepare(`
          INSERT INTO availabilities (id, profile_id, day_of_week, enabled, start_time, end_time)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(aId, id, a.dayOfWeek, a.enabled ? 1 : 0, a.startTime || '09:00', a.endTime || '17:00').run();
      }
    }

    const createdRow = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first<ProfileRow>();
    if (!createdRow) {
      return Response.json({ error: 'Failed to create profile' }, { status: 500 });
    }
    const createdProfile = await formatProfileWithRelations(createdRow, env.DB);
    return Response.json(createdProfile, { status: 201 });
  }

  // --- PUT /api/profiles/:id (Admin update profile) ---
  if (path.startsWith('/api/profiles/') && method === 'PUT') {
    const id = path.replace('/api/profiles/', '').trim();
    const body = await request.json<{
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
      socialLinks?: Array<{ platform: string; url: string }>;
    }>().catch(() => ({}));

    const current = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first<ProfileRow>();
    if (!current) {
      return Response.json({ error: `Profile with ID '${id}' not found.` }, { status: 404 });
    }

    const name = body.name ?? current.name;
    const title = body.title ?? current.title;
    const bio = body.bio ?? current.bio;
    const avatarUrl = body.avatarUrl ?? current.avatar_url;
    const phone = body.phone ?? current.phone;
    const theme = body.theme ?? current.theme;
    const customDomain = body.customDomain !== undefined ? body.customDomain : current.custom_domain;
    const country = body.country ?? current.country;
    const currency = body.currency ?? current.currency;
    const timezone = body.timezone ?? current.timezone;
    const credentials = body.credentials !== undefined ? JSON.stringify(body.credentials) : current.credentials;
    const socialLinks = body.socialLinks !== undefined ? JSON.stringify(body.socialLinks) : current.social_links;

    await env.DB.prepare(`
      UPDATE profiles
      SET name = ?, title = ?, bio = ?, avatar_url = ?, phone = ?, theme = ?, custom_domain = ?, country = ?, currency = ?, timezone = ?, credentials = ?, social_links = ?
      WHERE id = ?
    `).bind(name, title, bio, avatarUrl, phone, theme, customDomain, country, currency, timezone, credentials, socialLinks, id).run();

    const updatedRow = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(id).first<ProfileRow>();
    const updatedProfile = await formatProfileWithRelations(updatedRow!, env.DB);
    return Response.json(updatedProfile);
  }

  // --- DELETE /api/profiles/:id (Admin delete profile) ---
  if (path.startsWith('/api/profiles/') && method === 'DELETE') {
    const id = path.replace('/api/profiles/', '').trim();
    const current = await env.DB.prepare('SELECT id FROM profiles WHERE id = ?').bind(id).first();
    if (!current) {
      return Response.json({ error: `Profile with ID '${id}' not found.` }, { status: 404 });
    }

    await env.DB.prepare('DELETE FROM services WHERE profile_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM availabilities WHERE profile_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM appointments WHERE profile_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM profiles WHERE id = ?').bind(id).run();

    return Response.json({ success: true, message: `Profile '${id}' deleted.` });
  }

  // --- GET /api/resolve-domain?host=... ---
  if (path === '/api/resolve-domain' && method === 'GET') {
    const queryHost = (url.searchParams.get('host') || '').trim().toLowerCase();
    if (!queryHost) {
      return Response.json({ matched: false, error: 'Missing host parameter' }, { status: 400 });
    }

    const row = await env.DB.prepare('SELECT * FROM profiles WHERE LOWER(custom_domain) = ?')
      .bind(queryHost)
      .first<ProfileRow>();

    if (!row) {
      return Response.json({ matched: false });
    }

    const profile = await formatProfileWithRelations(row, env.DB);
    return Response.json({
      matched: true,
      profile,
      canonicalUrl: `/@${profile.slug}`,
    });
  }

  // --- POST /api/admin/login ---
  if (path === '/api/admin/login' && method === 'POST') {
    const body = await request.json<{ email?: string; password?: string }>().catch(() => ({}));
    if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
      return Response.json({ error: 'Invalid email or password payload' }, { status: 400 });
    }

    const adminEmail = env.ADMIN_EMAIL || 'admin@profilease.io';
    const adminPass = env.ADMIN_PASSWORD || 'admin123';
    const adminToken = 'prof-admin-token-supersecure-2026';

    if (body.email === adminEmail && body.password === adminPass) {
      return Response.json({
        success: true,
        token: adminToken,
        username: 'System Administrator',
      });
    }

    return Response.json({ error: 'Invalid admin credentials' }, { status: 401 });
  }

  // --- POST /api/client/login ---
  if (path === '/api/client/login' && method === 'POST') {
    const body = await request.json<{ email?: string; accessKey?: string }>().catch(() => ({}));
    if (!body.email || !body.accessKey) {
      return Response.json({ error: 'Missing client email or access key' }, { status: 400 });
    }

    const row = await env.DB.prepare('SELECT * FROM profiles WHERE LOWER(email) = ? AND client_access_key = ?')
      .bind(body.email.trim().toLowerCase(), body.accessKey.trim())
      .first<ProfileRow>();

    if (!row) {
      return Response.json({ error: 'Invalid client credentials or unauthorized profile.' }, { status: 401 });
    }

    const profile = await formatProfileWithRelations(row, env.DB);
    return Response.json({
      success: true,
      token: `client-token-${profile.id}-${Date.now()}`,
      profile,
    });
  }

  // --- GET /api/client/me?profileId=... ---
  if (path === '/api/client/me' && method === 'GET') {
    const profileId = url.searchParams.get('profileId');
    if (!profileId) {
      return Response.json({ error: 'Missing profileId query parameter' }, { status: 400 });
    }

    const row = await env.DB.prepare('SELECT * FROM profiles WHERE id = ? OR slug = ?')
      .bind(profileId, profileId)
      .first<ProfileRow>();

    if (!row) {
      return Response.json({ error: 'Client profile not found' }, { status: 404 });
    }

    const profile = await formatProfileWithRelations(row, env.DB);
    return Response.json({ profile });
  }

  // --- GET /api/client/appointments?profileId=... ---
  if (path === '/api/client/appointments' && method === 'GET') {
    const profileId = url.searchParams.get('profileId');
    if (!profileId) {
      return Response.json({ error: 'Missing profileId' }, { status: 400 });
    }

    const { results } = await env.DB.prepare('SELECT * FROM appointments WHERE profile_id = ? ORDER BY created_at DESC')
      .bind(profileId)
      .all<AppointmentRow>();

    return Response.json(
      results.map((r) => ({
        id: r.id,
        profileId: r.profile_id,
        serviceId: r.service_id,
        serviceTitle: r.service_title,
        clientName: r.client_name,
        clientEmail: r.client_email,
        clientPhone: r.client_phone,
        appointmentDate: r.appointment_date,
        appointmentTime: r.appointment_time,
        notes: r.notes || '',
        status: r.status,
        actionToken: r.action_token,
        createdAt: r.created_at,
      }))
    );
  }

  // --- PATCH /api/client/appointments/:id/status ---
  if (path.startsWith('/api/client/appointments/') && path.endsWith('/status') && method === 'PATCH') {
    const id = path.replace('/api/client/appointments/', '').replace('/status', '').trim();
    const body = await request.json<{ status?: string }>().catch(() => ({}));
    const status = body.status;
    const validStatuses = ['pending', 'confirmed', 'declined', 'cancelled', 'completed'];

    if (!status || !validStatuses.includes(status)) {
      return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const current = await env.DB.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first<AppointmentRow>();
    if (!current) {
      return Response.json({ error: `Appointment '${id}' not found.` }, { status: 404 });
    }

    await env.DB.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(status, id).run();
    const updated = await env.DB.prepare('SELECT * FROM appointments WHERE id = ?').bind(id).first<AppointmentRow>();

    return Response.json({
      id: updated!.id,
      profileId: updated!.profile_id,
      serviceId: updated!.service_id,
      serviceTitle: updated!.service_title,
      clientName: updated!.client_name,
      clientEmail: updated!.client_email,
      clientPhone: updated!.client_phone,
      appointmentDate: updated!.appointment_date,
      appointmentTime: updated!.appointment_time,
      notes: updated!.notes || '',
      status: updated!.status,
      actionToken: updated!.action_token,
      createdAt: updated!.created_at,
    });
  }

  // --- POST /api/appointments (Create booking + Async Resend email dispatch) ---
  if (path === '/api/appointments' && method === 'POST') {
    const body = await request.json<{
      profileId?: string;
      serviceId?: string;
      clientName?: string;
      clientEmail?: string;
      clientPhone?: string;
      appointmentDate?: string;
      appointmentTime?: string;
      notes?: string;
    }>().catch(() => ({}));

    if (
      !body.profileId ||
      !body.serviceId ||
      !body.clientName ||
      !body.clientEmail ||
      !body.appointmentDate ||
      !body.appointmentTime
    ) {
      return Response.json({ error: 'Missing required appointment fields.' }, { status: 400 });
    }

    const profile = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(body.profileId).first<ProfileRow>();
    if (!profile) {
      return Response.json({ error: 'Profile not found to book with.' }, { status: 404 });
    }

    const service = await env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(body.serviceId).first<ServiceRow>();
    const serviceTitle = service?.name || 'General Consultation';

    const appointmentId = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const actionToken = `act-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    await env.DB.prepare(`
      INSERT INTO appointments (
        id, profile_id, service_id, service_title, client_name, client_email,
        client_phone, appointment_date, appointment_time, notes, status, action_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).bind(
      appointmentId,
      body.profileId,
      body.serviceId,
      serviceTitle,
      body.clientName,
      body.clientEmail,
      body.clientPhone || '',
      body.appointmentDate,
      body.appointmentTime,
      body.notes || '',
      actionToken
    ).run();

    // Async Email Dispatch using Cloudflare's ctx.waitUntil() (zero patient latency!)
    const origin = url.origin;
    const acceptUrl = `${origin}/api/appointments/action?token=${actionToken}&action=confirm`;
    const declineUrl = `${origin}/api/appointments/action?token=${actionToken}&action=decline`;

    ctx.waitUntil(
      dispatchResendEmails({
        env,
        professionalEmail: profile.email,
        professionalName: profile.name,
        clientEmail: body.clientEmail,
        clientName: body.clientName,
        serviceTitle,
        appointmentDate: body.appointmentDate,
        appointmentTime: body.appointmentTime,
        acceptUrl,
        declineUrl,
      })
    );

    return Response.json(
      {
        id: appointmentId,
        profileId: body.profileId,
        serviceId: body.serviceId,
        serviceTitle,
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        clientPhone: body.clientPhone || '',
        appointmentDate: body.appointmentDate,
        appointmentTime: body.appointmentTime,
        notes: body.notes || '',
        status: 'pending',
        actionToken,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }

  // --- GET /api/appointments/action?token=...&action=confirm|decline ---
  if (path === '/api/appointments/action' && method === 'GET') {
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');

    if (!token || !action || (action !== 'confirm' && action !== 'decline')) {
      return new Response('Invalid action token or parameter.', { status: 400 });
    }

    const appointment = await env.DB.prepare('SELECT * FROM appointments WHERE action_token = ?')
      .bind(token)
      .first<AppointmentRow>();

    if (!appointment) {
      return new Response('Appointment not found for this token.', { status: 404 });
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'declined';
    await env.DB.prepare('UPDATE appointments SET status = ? WHERE id = ?').bind(newStatus, appointment.id).run();

    const isConfirmed = newStatus === 'confirmed';
    const accentColor = isConfirmed ? '#0d9488' : '#ef4444';
    const statusHeading = isConfirmed ? 'APPOINTMENT CONFIRMED' : 'APPOINTMENT DECLINED';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${statusHeading} - Profilease</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #0a0a0a; color: #f5f5f5; padding: 40px 20px; text-align: center; }
    .card { max-width: 520px; margin: 40px auto; background: #171717; border: 2px solid ${accentColor}; padding: 32px; box-shadow: 8px 8px 0px 0px rgba(0,0,0,1); }
    h1 { color: ${accentColor}; font-size: 20px; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
    p { font-size: 13px; line-height: 1.6; color: #a3a3a3; }
    .badge { display: inline-block; padding: 6px 12px; background: #262626; border: 1px solid #404040; font-weight: bold; margin: 16px 0; color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${statusHeading}</h1>
    <div class="badge">${appointment.service_title}</div>
    <p>Client: <strong>${appointment.client_name}</strong> (${appointment.client_email})</p>
    <p>Scheduled: <strong>${appointment.appointment_date}</strong> at <strong>${appointment.appointment_time}</strong></p>
    <p style="margin-top: 24px; font-size: 11px; color: #737373;">Processed instantly at Cloudflare Global Edge.</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // --- PUT /api/client/profile (Update practitioner profile in D1) ---
  if (path === '/api/client/profile' && method === 'PUT') {
    const body = await request.json<{
      id?: string;
      name?: string;
      title?: string;
      bio?: string;
      avatarUrl?: string;
      phone?: string;
      location?: string;
      clinicOrSchoolName?: string;
      credentials?: string[];
      socialLinks?: Array<{ platform: string; url: string }>;
      emergencyNotice?: string;
    }>().catch(() => ({}));

    if (!body.id) {
      return Response.json({ error: 'Missing profile ID in update body.' }, { status: 400 });
    }

    const current = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(body.id).first<ProfileRow>();
    if (!current) {
      return Response.json({ error: `Profile '${body.id}' not found.` }, { status: 404 });
    }

    const updatedName = body.name ?? current.name;
    const updatedTitle = body.title ?? current.title;
    const updatedBio = body.bio ?? current.bio;
    const updatedAvatar = body.avatarUrl ?? current.avatar_url;
    const updatedPhone = body.phone ?? current.phone;
    const updatedCredentials = body.credentials ? JSON.stringify(body.credentials) : current.credentials;
    const updatedSocialLinks = body.socialLinks ? JSON.stringify(body.socialLinks) : (current.social_links || null);

    await env.DB.prepare(`
      UPDATE profiles
      SET name = ?, title = ?, bio = ?, avatar_url = ?, phone = ?, credentials = ?, social_links = ?
      WHERE id = ?
    `).bind(updatedName, updatedTitle, updatedBio, updatedAvatar, updatedPhone, updatedCredentials, updatedSocialLinks, body.id).run();

    const updatedRow = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(body.id).first<ProfileRow>();
    if (!updatedRow) {
      return Response.json({ error: 'Failed to retrieve updated profile' }, { status: 500 });
    }

    const formatted = await formatProfileWithRelations(updatedRow, env.DB);
    return Response.json(formatted);
  }

  // --- POST /api/upload (Tigris S3-compatible storage) ---
  if (path === '/api/upload' && method === 'POST') {
    const body = await request.json<{
      imageBase64?: string;
      filename?: string;
      mimeType?: string;
    }>().catch(() => ({}));

    if (!body.imageBase64) {
      return Response.json({ error: 'Missing imageBase64 payload.' }, { status: 400 });
    }

    const raw = body.imageBase64;
    const matches = raw.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const mimeType = matches ? matches[1] : (body.mimeType || 'image/webp');
    const base64Data = matches ? matches[2] : raw;

    // Convert base64 to Uint8Array binary
    const binaryString = atob(base64Data);
    const buffer = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      buffer[i] = binaryString.charCodeAt(i);
    }

    const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
    const fileKey = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;

    // Upload to Tigris via S3-compatible signed PUT
    if (env.TIGRIS_ACCESS_KEY_ID && env.TIGRIS_SECRET_ACCESS_KEY && env.TIGRIS_BUCKET) {
      const endpoint = env.TIGRIS_ENDPOINT || 'https://t3.storage.dev';
      const region = env.TIGRIS_REGION || 'auto';
      const uploadUrl = `${endpoint}/${env.TIGRIS_BUCKET}/${fileKey}`;
      const signedHeaders = await signS3Request({
        method: 'PUT',
        url: uploadUrl,
        region,
        accessKeyId: env.TIGRIS_ACCESS_KEY_ID,
        secretAccessKey: env.TIGRIS_SECRET_ACCESS_KEY,
        contentType: mimeType,
        body: buffer,
      });
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { ...signedHeaders, 'Content-Type': mimeType },
        body: buffer,
      });
      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        return Response.json({ error: `Tigris upload failed: ${errText}` }, { status: 502 });
      }
    } else {
      // Fallback: keep in worker memory cache for local dev
      mediaCacheWorker.set(fileKey, { buffer, mimeType });
    }

    const mediaUrl = `${url.origin}/api/media/${fileKey}`;
    return Response.json(
      {
        success: true,
        key: fileKey,
        url: mediaUrl,
        sizeBytes: buffer.byteLength,
        mimeType,
      },
      { status: 201 }
    );
  }

  // --- GET /api/media/:key (Serve media assets from Tigris / cache) ---
  if (path.startsWith('/api/media/') && method === 'GET') {
    const key = path.replace('/api/media/', '').trim();

    // 1. Try Tigris bucket via signed GET
    if (env.TIGRIS_ACCESS_KEY_ID && env.TIGRIS_SECRET_ACCESS_KEY && env.TIGRIS_BUCKET) {
      const endpoint = env.TIGRIS_ENDPOINT || 'https://t3.storage.dev';
      const region = env.TIGRIS_REGION || 'auto';
      const objectUrl = `${endpoint}/${env.TIGRIS_BUCKET}/${key}`;
      const signedHeaders = await signS3Request({
        method: 'GET',
        url: objectUrl,
        region,
        accessKeyId: env.TIGRIS_ACCESS_KEY_ID,
        secretAccessKey: env.TIGRIS_SECRET_ACCESS_KEY,
      });
      const res = await fetch(objectUrl, { method: 'GET', headers: signedHeaders });
      if (res.ok) {
        const headers = new Headers();
        headers.set('Content-Type', res.headers.get('Content-Type') || 'image/webp');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        const etag = res.headers.get('ETag');
        if (etag) headers.set('ETag', etag);
        return new Response(res.body, { headers });
      }
    }

    // 2. Fallback to worker memory cache (local dev)
    const cached = mediaCacheWorker.get(key);
    if (cached) {
      return new Response(cached.buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': cached.mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }

    return Response.json({ error: `Media asset '${key}' not found.` }, { status: 404 });
  }

  return Response.json({ error: 'Endpoint not found' }, { status: 404 });
}

// ---------------------------------------------------------------------------
// AWS Signature V4 helper for Tigris (S3-compatible) — no external SDK needed
// ---------------------------------------------------------------------------
async function signS3Request(opts: {
  method: string;
  url: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  contentType?: string;
  body?: Uint8Array;
}): Promise<Record<string, string>> {
  const { method, url: rawUrl, region, accessKeyId, secretAccessKey, contentType, body } = opts;
  const parsed = new URL(rawUrl);
  const host = parsed.host;
  const pathname = parsed.pathname;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  // Payload hash
  const payloadBytes = body ?? new Uint8Array(0);
  const payloadHashBuf = await crypto.subtle.digest('SHA-256', payloadBytes);
  const payloadHash = Array.from(new Uint8Array(payloadHashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Canonical headers
  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) headers['content-type'] = contentType;

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  const canonicalRequest = [
    method.toUpperCase(),
    pathname,
    '', // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  // String to sign
  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const canonicalHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest));
  const canonicalHash = Array.from(new Uint8Array(canonicalHashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${canonicalHash}`;

  // Signing key
  const enc = new TextEncoder();
  const hmac = async (key: ArrayBuffer, data: string) =>
    crypto.subtle.sign('HMAC', await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']), enc.encode(data));

  const kDate = await hmac(enc.encode(`AWS4${secretAccessKey}`).buffer as ArrayBuffer, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');
  const sigBuf = await hmac(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const result: Record<string, string> = {
    Authorization: authorization,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
  };
  if (contentType) result['Content-Type'] = contentType;
  return result;
}

async function formatProfileWithRelations(row: ProfileRow, db: D1Database) {
  const [servicesRes, availRes] = await Promise.all([
    db.prepare('SELECT * FROM services WHERE profile_id = ? AND is_active = 1').bind(row.id).all<ServiceRow>(),
    db.prepare('SELECT * FROM availabilities WHERE profile_id = ?').bind(row.id).all<AvailabilityRow>(),
  ]);

  let credentials: string[] = [];
  try {
    if (row.credentials) credentials = JSON.parse(row.credentials);
  } catch {
    credentials = [];
  }

  let socialLinks: Array<{ platform: string; url: string }> = [];
  try {
    if (row.social_links) socialLinks = JSON.parse(row.social_links);
  } catch {
    socialLinks = [];
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    profession: row.profession,
    title: row.title,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    theme: row.theme,
    customDomain: row.custom_domain,
    clientAccessKey: row.client_access_key,
    email: row.email,
    phone: row.phone,
    country: row.country,
    currency: row.currency,
    timezone: row.timezone,
    credentials,
    socialLinks,
    services: servicesRes.results.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMinutes: s.duration_minutes,
      price: s.price,
      isActive: s.is_active === 1,
    })),
    availability: availRes.results.map((a) => ({
      dayOfWeek: a.day_of_week,
      enabled: a.enabled === 1,
      startTime: a.start_time,
      endTime: a.end_time,
    })),
  };
}

async function dispatchResendEmails(params: {
  env: Env;
  professionalEmail: string;
  professionalName: string;
  clientEmail: string;
  clientName: string;
  serviceTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  acceptUrl: string;
  declineUrl: string;
}): Promise<void> {
  const apiKey = params.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const fromEmail = params.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  // 1. Alert to Professional with 1-Click Accept / Decline
  try {
    await resend.emails.send({
      from: `Profilease <${fromEmail}>`,
      to: [params.professionalEmail],
      subject: `New Booking: ${params.clientName} - ${params.serviceTitle}`,
      html: `
        <div style="font-family: monospace; padding: 24px; border: 2px solid #0a0a0a; max-width: 500px;">
          <h2 style="text-transform: uppercase;">New Appointment Request</h2>
          <p><strong>${params.clientName}</strong> booked <strong>${params.serviceTitle}</strong>.</p>
          <p>Date: ${params.appointmentDate} at ${params.appointmentTime}</p>
          <div style="margin: 24px 0;">
            <a href="${params.acceptUrl}" style="background: #0d9488; color: #fff; padding: 10px 18px; text-decoration: none; font-weight: bold; margin-right: 12px; display: inline-block;">ACCEPT APPOINTMENT</a>
            <a href="${params.declineUrl}" style="background: #ef4444; color: #fff; padding: 10px 18px; text-decoration: none; font-weight: bold; display: inline-block;">DECLINE</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend dispatch error (professional):', err);
  }

  // 2. Receipt to Client
  try {
    await resend.emails.send({
      from: `Profilease <${fromEmail}>`,
      to: [params.clientEmail],
      subject: `Appointment Received: ${params.serviceTitle} with ${params.professionalName}`,
      html: `
        <div style="font-family: monospace; padding: 24px; border: 2px solid #0a0a0a; max-width: 500px;">
          <h2 style="text-transform: uppercase;">Appointment Request Received</h2>
          <p>Hello ${params.clientName}, your request for <strong>${params.serviceTitle}</strong> with <strong>${params.professionalName}</strong> is being processed.</p>
          <p>Scheduled: ${params.appointmentDate} at ${params.appointmentTime}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend dispatch error (client):', err);
  }
}
