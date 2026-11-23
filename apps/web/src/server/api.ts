import { Router, Request, Response } from 'express';
import {
  CreateProfileDto,
  UpdateProfileDto,
  CreateAppointmentDto,
  AppointmentStatus,
  AdminLoginDto,
  ClientLoginDto,
  AppointmentNotificationMessage,
} from '@profilease/types';
import { db } from './db';

export const apiRouter = Router();

// Admin credentials
const ADMIN_EMAIL = 'admin@profilease.io';
const ADMIN_PASS = 'admin123';
const ADMIN_TOKEN = 'prof-admin-token-supersecure-2026';

// Notification service URL
const NOTIFICATION_SERVICE_URL = process.env['NOTIFICATION_SERVICE_URL'] || 'http://127.0.0.1:3333/api/notifications/dispatch';

async function dispatchNotification(msg: AppointmentNotificationMessage): Promise<void> {
  try {
    const res = await fetch(NOTIFICATION_SERVICE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg }),
    });
    if (!res.ok) {
      console.warn(`[NOTIFICATIONS] Dispatch returned status ${res.status}`);
    }
  } catch (err) {
    console.warn(`[NOTIFICATIONS] Background dispatch failed (Service might be offline): ${(err as Error).message}`);
  }
}

// ----------------------------------------------------
// 1. ADMIN AUTHENTICATION
// ----------------------------------------------------
apiRouter.post('/admin/login', (req: Request, res: Response): void => {
  const body = req.body as Partial<AdminLoginDto> | undefined;
  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    res.status(400).json({ error: 'Invalid email or password payload' });
    return;
  }

  if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASS) {
    res.json({
      success: true,
      token: ADMIN_TOKEN,
      username: 'System Administrator',
    });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

// ----------------------------------------------------
// 2. CLIENT (BUSINESS PERSON) AUTHENTICATION
// ----------------------------------------------------
apiRouter.post('/client/login', (req: Request, res: Response): void => {
  const body = req.body as Partial<ClientLoginDto> | undefined;
  if (!body || typeof body.email !== 'string' || typeof body.accessKey !== 'string') {
    res.status(400).json({ error: 'Missing client email or access key' });
    return;
  }

  const profile = db.getClientProfileByCredentials(body.email, body.accessKey);
  if (!profile) {
    res.status(401).json({ error: 'Invalid client credentials or unauthorized profile.' });
    return;
  }

  res.json({
    success: true,
    token: `client-token-${profile.id}-${Date.now()}`,
    profile,
  });
});

// GET /api/client/me?profileId=xxx
apiRouter.get('/client/me', (req: Request, res: Response): void => {
  const profileId = typeof req.query['profileId'] === 'string' ? req.query['profileId'] : undefined;
  if (!profileId) {
    res.status(400).json({ error: 'Missing profileId query parameter' });
    return;
  }

  const profile = db.getProfileByIdOrSlug(profileId);
  if (!profile) {
    res.status(404).json({ error: 'Client profile not found' });
    return;
  }

  res.json({ profile });
});

// PUT /api/client/profile (Client updates own profile: services, pricing, timings, availability, etc.)
apiRouter.put('/client/profile', (req: Request, res: Response): void => {
  const body = req.body as Partial<UpdateProfileDto> | undefined;
  if (!body || !body.id) {
    res.status(400).json({ error: 'Missing profile ID in update body' });
    return;
  }

  const updated = db.updateProfile(body as UpdateProfileDto);
  if (!updated) {
    res.status(404).json({ error: `Client profile '${body.id}' not found.` });
    return;
  }

  res.json(updated);
});

// GET /api/client/appointments?profileId=xxx
apiRouter.get('/client/appointments', (req: Request, res: Response): void => {
  const profileId = typeof req.query['profileId'] === 'string' ? req.query['profileId'] : undefined;
  if (!profileId) {
    res.status(400).json({ error: 'Missing profileId query parameter' });
    return;
  }

  const appointments = db.getAppointments(profileId);
  res.json(appointments);
});

// PATCH /api/client/appointments/:id/status (Client accepts/declines/updates appointment)
apiRouter.patch('/client/appointments/:id/status', async (req: Request, res: Response): Promise<void> => {
  const id = req.params['id'];
  const body = req.body as { status?: string } | undefined;
  const status = body?.status as AppointmentStatus | undefined;

  const validStatuses: readonly AppointmentStatus[] = ['pending', 'confirmed', 'declined', 'cancelled', 'completed'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const updated = db.updateAppointmentStatus(id, status);
  if (!updated) {
    res.status(404).json({ error: `Appointment '${id}' not found.` });
    return;
  }

  // Trigger status change notification
  const profile = db.getProfileByIdOrSlug(updated.profileId);
  if (profile) {
    const origin = `${req.protocol}://${req.get('host')}`;
    const notification: AppointmentNotificationMessage = {
      eventId: `evt-${Date.now()}`,
      eventType: status === 'confirmed' ? 'appointment.confirmed' : status === 'declined' ? 'appointment.declined' : 'appointment.cancelled',
      appointmentId: updated.id,
      profileId: profile.id,
      clientName: updated.clientName,
      clientEmail: updated.clientEmail,
      clientPhone: updated.clientPhone,
      professionalName: profile.name,
      professionalEmail: profile.email,
      professionalPhone: profile.phone,
      serviceTitle: updated.serviceTitle,
      appointmentDate: updated.appointmentDate,
      appointmentTime: updated.appointmentTime,
      notes: updated.notes,
      actionToken: updated.actionToken,
      acceptUrl: `${origin}/api/appointments/action?token=${updated.actionToken}&action=confirm`,
      declineUrl: `${origin}/api/appointments/action?token=${updated.actionToken}&action=decline`,
      channels: ['email', 'whatsapp'],
      sentAt: new Date().toISOString(),
    };
    dispatchNotification(notification);
  }

  res.json(updated);
});

// ----------------------------------------------------
// 3. ONE-CLICK INSTANT ACTION (EMAIL / WHATSAPP 1-CLICK)
// ----------------------------------------------------
apiRouter.get('/appointments/action', async (req: Request, res: Response): Promise<void> => {
  const token = typeof req.query['token'] === 'string' ? req.query['token'] : undefined;
  const action = typeof req.query['action'] === 'string' ? req.query['action'] : undefined;

  if (!token || !action || (action !== 'confirm' && action !== 'decline')) {
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: monospace; padding: 40px; text-align: center; background: #0f172a; color: #f8fafc;">
        <h1 style="border: 2px solid #ef4444; padding: 20px; display: inline-block;">INVALID ACTION LINK</h1>
        <p>The action link provided is invalid or has expired.</p>
      </body>
      </html>
    `);
    return;
  }

  const appointment = db.getAppointmentByActionToken(token);
  if (!appointment) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <body style="font-family: monospace; padding: 40px; text-align: center; background: #0f172a; color: #f8fafc;">
        <h1 style="border: 2px solid #ef4444; padding: 20px; display: inline-block;">APPOINTMENT NOT FOUND</h1>
        <p>No matching appointment was found for this token.</p>
      </body>
      </html>
    `);
    return;
  }

  const newStatus: AppointmentStatus = action === 'confirm' ? 'confirmed' : 'declined';
  const updated = db.updateAppointmentStatus(appointment.id, newStatus);
  const profile = db.getProfileByIdOrSlug(appointment.profileId);

  // Notify parties
  if (profile && updated) {
    const origin = `${req.protocol}://${req.get('host')}`;
    const notification: AppointmentNotificationMessage = {
      eventId: `evt-${Date.now()}`,
      eventType: newStatus === 'confirmed' ? 'appointment.confirmed' : 'appointment.declined',
      appointmentId: updated.id,
      profileId: profile.id,
      clientName: updated.clientName,
      clientEmail: updated.clientEmail,
      clientPhone: updated.clientPhone,
      professionalName: profile.name,
      professionalEmail: profile.email,
      professionalPhone: profile.phone,
      serviceTitle: updated.serviceTitle,
      appointmentDate: updated.appointmentDate,
      appointmentTime: updated.appointmentTime,
      notes: updated.notes,
      actionToken: updated.actionToken,
      acceptUrl: `${origin}/api/appointments/action?token=${updated.actionToken}&action=confirm`,
      declineUrl: `${origin}/api/appointments/action?token=${updated.actionToken}&action=decline`,
      channels: ['email', 'whatsapp'],
      sentAt: new Date().toISOString(),
    };
    dispatchNotification(notification);
  }

  const isConfirmed = newStatus === 'confirmed';
  const accentColor = isConfirmed ? '#0d9488' : '#ef4444';
  const statusHeading = isConfirmed ? 'APPOINTMENT CONFIRMED' : 'APPOINTMENT DECLINED';
  const messageText = isConfirmed
    ? `You have successfully accepted the booking with ${appointment.clientName} for ${appointment.serviceTitle} on ${appointment.appointmentDate} at ${appointment.appointmentTime}.`
    : `You have declined the booking with ${appointment.clientName}. An update notification has been dispatched.`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${statusHeading} - Profilease</title>
      <style>
        * { box-sizing: border-box; border-radius: 0 !important; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #090d16; color: #f8fafc; margin: 0; padding: 40px 16px; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .card { max-width: 560px; width: 100%; background: #131b2e; border: 3px solid ${accentColor}; padding: 36px 32px; box-shadow: 10px 10px 0px #000; }
        .tag { display: inline-block; background: ${accentColor}; color: #ffffff; padding: 4px 10px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; }
        h1 { margin: 0 0 16px 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; }
        p { color: #94a3b8; line-height: 1.6; font-size: 15px; margin-bottom: 24px; }
        .meta-box { background: #0c1220; border: 1px solid #1e293b; padding: 18px; margin-bottom: 28px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .meta-row:last-child { margin-bottom: 0; }
        .lbl { color: #64748b; font-weight: 600; }
        .val { color: #f8fafc; font-weight: 700; }
        .btn-portal { display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 24px; text-decoration: none; font-weight: 700; text-transform: uppercase; font-size: 13px; letter-spacing: 0.05em; border: 2px solid #3b82f6; }
        .btn-portal:hover { background: #2563eb; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="tag">Profilease Instant 1-Click Action</div>
        <h1 style="color: ${accentColor}">${statusHeading}</h1>
        <p>${messageText}</p>

        <div class="meta-box">
          <div class="meta-row"><span class="lbl">Client / Patient:</span><span class="val">${appointment.clientName}</span></div>
          <div class="meta-row"><span class="lbl">Service:</span><span class="val">${appointment.serviceTitle}</span></div>
          <div class="meta-row"><span class="lbl">Date & Time:</span><span class="val">${appointment.appointmentDate} at ${appointment.appointmentTime}</span></div>
          <div class="meta-row"><span class="lbl">Client Phone:</span><span class="val">${appointment.clientPhone}</span></div>
        </div>

        <a href="/portal" class="btn-portal">Go to Client Dashboard &rarr;</a>
      </div>
    </body>
    </html>
  `);
});

// ----------------------------------------------------
// 4. DOMAIN RESOLUTION & PROFILES (ADMIN / PUBLIC)
// ----------------------------------------------------
apiRouter.get('/resolve-domain', (req: Request, res: Response): void => {
  const host = typeof req.query['host'] === 'string' ? req.query['host'] : req.hostname;
  const profile = db.getProfileByCustomDomain(host);
  if (profile) {
    res.json({ matched: true, profile });
  } else {
    res.json({ matched: false });
  }
});

apiRouter.get('/profiles', (_req: Request, res: Response): void => {
  const profiles = db.getProfiles();
  res.json(profiles);
});

apiRouter.get('/profiles/:idOrSlug', (req: Request, res: Response): void => {
  const idOrSlug = req.params['idOrSlug'];
  const profile = db.getProfileByIdOrSlug(idOrSlug);
  if (!profile) {
    res.status(404).json({ error: `Profile not found for identifier '${idOrSlug}'` });
    return;
  }
  res.json(profile);
});

// POST /api/profiles (Admin onboard client)
apiRouter.post('/profiles', (req: Request, res: Response): void => {
  const body = req.body as CreateProfileDto | undefined;
  if (!body || !body.name || !body.slug || !body.profession) {
    res.status(400).json({ error: 'Missing required profile fields (name, slug, profession)' });
    return;
  }

  const existing = db.getProfileByIdOrSlug(body.slug);
  if (existing) {
    res.status(409).json({ error: `A profile with slug '${body.slug}' already exists.` });
    return;
  }

  const created = db.createProfile(body);
  res.status(201).json(created);
});

// PUT /api/profiles/:id (Admin update profile)
apiRouter.put('/profiles/:id', (req: Request, res: Response): void => {
  const id = req.params['id'];
  const body = req.body as Partial<CreateProfileDto> | undefined;
  if (!body) {
    res.status(400).json({ error: 'Missing update payload' });
    return;
  }

  const updateDto: UpdateProfileDto = {
    ...body,
    id,
  };

  const updated = db.updateProfile(updateDto);
  if (!updated) {
    res.status(404).json({ error: `Profile with ID '${id}' not found.` });
    return;
  }
  res.json(updated);
});

// DELETE /api/profiles/:id (Admin delete client profile)
apiRouter.delete('/profiles/:id', (req: Request, res: Response): void => {
  const id = req.params['id'];
  const deleted = db.deleteProfile(id);
  if (!deleted) {
    res.status(404).json({ error: `Profile with ID '${id}' not found.` });
    return;
  }
  res.json({ success: true, message: `Profile '${id}' deleted.` });
});

// ----------------------------------------------------
// 5. PUBLIC APPOINTMENT BOOKING & NOTIFICATION TRIGGER
// ----------------------------------------------------
apiRouter.post('/appointments', async (req: Request, res: Response): Promise<void> => {
  const body = req.body as CreateAppointmentDto | undefined;
  if (
    !body ||
    !body.profileId ||
    !body.serviceId ||
    !body.clientName ||
    !body.clientEmail ||
    !body.appointmentDate ||
    !body.appointmentTime
  ) {
    res.status(400).json({ error: 'Missing required appointment fields.' });
    return;
  }

  const created = db.createAppointment(body);
  if (!created) {
    res.status(404).json({ error: 'Profile not found to book appointment with.' });
    return;
  }

  const profile = db.getProfileByIdOrSlug(created.profileId);
  if (profile) {
    const origin = `${req.protocol}://${req.get('host')}`;
    const notification: AppointmentNotificationMessage = {
      eventId: `evt-${Date.now()}`,
      eventType: 'appointment.created',
      appointmentId: created.id,
      profileId: profile.id,
      clientName: created.clientName,
      clientEmail: created.clientEmail,
      clientPhone: created.clientPhone,
      professionalName: profile.name,
      professionalEmail: profile.email,
      professionalPhone: profile.phone,
      serviceTitle: created.serviceTitle,
      appointmentDate: created.appointmentDate,
      appointmentTime: created.appointmentTime,
      notes: created.notes,
      actionToken: created.actionToken,
      acceptUrl: `${origin}/api/appointments/action?token=${created.actionToken}&action=confirm`,
      declineUrl: `${origin}/api/appointments/action?token=${created.actionToken}&action=decline`,
      channels: ['email', 'whatsapp'],
      sentAt: new Date().toISOString(),
    };
    dispatchNotification(notification);
  }

  res.status(201).json(created);
});
