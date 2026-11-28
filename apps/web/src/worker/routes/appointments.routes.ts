import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { appointments, profiles, services } from '../db/schema';
import { dispatchBookingEmails } from '../services/email.service';
import { parseJson, type AppContext } from '../types';

export const appointmentsRoutes = new Hono<AppContext>();

appointmentsRoutes.post('/', async (c) => {
  const body = await parseJson<{
    profileId?: string;
    serviceId?: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    notes?: string;
  }>(c.req.raw);

  if (
    !body.profileId ||
    !body.serviceId ||
    !body.clientName ||
    !body.clientEmail ||
    !body.appointmentDate ||
    !body.appointmentTime
  ) {
    return c.json({ error: 'Missing required appointment fields.' }, 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const profile = await db.select().from(profiles).where(eq(profiles.id, body.profileId)).get();
  if (!profile) {
    return c.json({ error: 'Profile not found to book with.' }, 404);
  }

  const service = await db.select().from(services).where(eq(services.id, body.serviceId)).get();
  const serviceTitle = service?.name || 'General Consultation';

  const appointmentId = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const actionToken = `act-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

  await db.insert(appointments).values({
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
  });

  const origin = new URL(c.req.url).origin;
  c.executionCtx.waitUntil(
    dispatchBookingEmails({
      env: c.env,
      professionalEmail: profile.email,
      professionalName: profile.name,
      clientEmail: body.clientEmail,
      clientName: body.clientName,
      serviceTitle,
      appointmentDate: body.appointmentDate,
      appointmentTime: body.appointmentTime,
      acceptUrl: `${origin}/api/appointments/action?token=${actionToken}&action=confirm`,
      declineUrl: `${origin}/api/appointments/action?token=${actionToken}&action=decline`,
    })
  );

  return c.json(
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
    201
  );
});

appointmentsRoutes.get('/action', async (c) => {
  const token = c.req.query('token');
  const action = c.req.query('action');

  if (!token || !action || (action !== 'confirm' && action !== 'decline')) {
    return c.text('Invalid action token or parameter.', 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const appointment = await db
    .select()
    .from(appointments)
    .where(eq(appointments.actionToken, token))
    .get();

  if (!appointment) {
    return c.text('Appointment not found for this token.', 404);
  }

  const newStatus = action === 'confirm' ? 'confirmed' : 'declined';
  await db.update(appointments).set({ status: newStatus }).where(eq(appointments.id, appointment.id));

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
    <div class="badge">${appointment.serviceTitle}</div>
    <p>Client: <strong>${appointment.clientName}</strong> (${appointment.clientEmail})</p>
    <p>Scheduled: <strong>${appointment.appointmentDate}</strong> at <strong>${appointment.appointmentTime}</strong></p>
    <p style="margin-top: 24px; font-size: 11px; color: #737373;">Processed instantly at Cloudflare Global Edge.</p>
  </div>
</body>
</html>`;

  return c.html(html);
});
