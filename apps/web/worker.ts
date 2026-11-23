/// <reference types="@cloudflare/workers-types" />
import { Resend } from 'resend';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  STORAGE?: R2Bucket;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  NODE_ENV?: string;
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

    // SPA Fallback: Serve index.html for Angular client-side routing
    return env.ASSETS.fetch(new Request(new URL('/index.html', url.origin).toString(), request));
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

    await env.DB.prepare(`
      UPDATE profiles
      SET name = ?, title = ?, bio = ?, avatar_url = ?, phone = ?, credentials = ?
      WHERE id = ?
    `).bind(updatedName, updatedTitle, updatedBio, updatedAvatar, updatedPhone, updatedCredentials, body.id).run();

    const updatedRow = await env.DB.prepare('SELECT * FROM profiles WHERE id = ?').bind(body.id).first<ProfileRow>();
    if (!updatedRow) {
      return Response.json({ error: 'Failed to retrieve updated profile' }, { status: 500 });
    }

    const formatted = await formatProfileWithRelations(updatedRow, env.DB);
    return Response.json(formatted);
  }

  // --- POST /api/upload (Cloudflare R2 storage / fallback base64 image ingest) ---
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

    // 1. Write to R2 Bucket if bound
    if (env.STORAGE) {
      await env.STORAGE.put(fileKey, buffer, {
        httpMetadata: { contentType: mimeType },
      });
    }

    // 2. Also keep in memory cache for immediate local/preview availability
    mediaCacheWorker.set(fileKey, { buffer, mimeType });

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

  // --- GET /api/media/:key (Serve media assets from R2 / cache) ---
  if (path.startsWith('/api/media/') && method === 'GET') {
    const key = path.replace('/api/media/', '').trim();

    // 1. Try R2 bucket first
    if (env.STORAGE) {
      const object = await env.STORAGE.get(key);
      if (object) {
        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'image/webp');
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('ETag', object.httpEtag);
        return new Response(object.body, { headers });
      }
    }

    // 2. Fallback to worker memory cache
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
