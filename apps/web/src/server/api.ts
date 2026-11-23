import { Router, Request, Response, NextFunction } from 'express';
import {
  CreateProfileDto,
  UpdateProfileDto,
  CreateAppointmentDto,
  AppointmentStatus,
  AdminLoginDto,
} from '@profilease/types';
import { db } from './db';

export const apiRouter = Router();

// Middleware: Parse JSON bodies
apiRouter.use((req: Request, res: Response, next: NextFunction): void => {
  next();
});

// Admin simple auth verification
const ADMIN_EMAIL = 'admin@profilease.io';
const ADMIN_PASS = 'admin123';
const ADMIN_TOKEN = 'prof-admin-token-supersecure-2026';

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

// GET /api/resolve-domain?host=example.com
apiRouter.get('/resolve-domain', (req: Request, res: Response): void => {
  const host = typeof req.query['host'] === 'string' ? req.query['host'] : req.hostname;
  const profile = db.getProfileByCustomDomain(host);
  if (profile) {
    res.json({ matched: true, profile });
  } else {
    res.json({ matched: false });
  }
});

// GET /api/profiles
apiRouter.get('/profiles', (_req: Request, res: Response): void => {
  const profiles = db.getProfiles();
  res.json(profiles);
});

// GET /api/profiles/:idOrSlug
apiRouter.get('/profiles/:idOrSlug', (req: Request, res: Response): void => {
  const idOrSlug = req.params['idOrSlug'];
  const profile = db.getProfileByIdOrSlug(idOrSlug);
  if (!profile) {
    res.status(404).json({ error: `Profile not found for identifier '${idOrSlug}'` });
    return;
  }
  res.json(profile);
});

// POST /api/profiles (Admin create)
apiRouter.post('/profiles', (req: Request, res: Response): void => {
  const body = req.body as CreateProfileDto | undefined;
  if (!body || !body.name || !body.slug || !body.profession) {
    res.status(400).json({ error: 'Missing required profile fields (name, slug, profession)' });
    return;
  }

  // Check slug uniqueness
  const existing = db.getProfileByIdOrSlug(body.slug);
  if (existing) {
    res.status(409).json({ error: `A profile with slug '${body.slug}' already exists.` });
    return;
  }

  const created = db.createProfile(body);
  res.status(201).json(created);
});

// PUT /api/profiles/:id (Admin update)
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

// DELETE /api/profiles/:id (Admin delete)
apiRouter.delete('/profiles/:id', (req: Request, res: Response): void => {
  const id = req.params['id'];
  const deleted = db.deleteProfile(id);
  if (!deleted) {
    res.status(404).json({ error: `Profile with ID '${id}' not found.` });
    return;
  }
  res.json({ success: true, message: `Profile '${id}' deleted.` });
});

// GET /api/appointments
apiRouter.get('/appointments', (req: Request, res: Response): void => {
  const profileId = typeof req.query['profileId'] === 'string' ? req.query['profileId'] : undefined;
  const appointments = db.getAppointments(profileId);
  res.json(appointments);
});

// POST /api/appointments (Client booking)
apiRouter.post('/appointments', (req: Request, res: Response): void => {
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
  res.status(201).json(created);
});

// PATCH /api/appointments/:id/status (Admin change status)
apiRouter.patch('/appointments/:id/status', (req: Request, res: Response): void => {
  const id = req.params['id'];
  const body = req.body as { status?: string } | undefined;
  const status = body?.status as AppointmentStatus | undefined;

  const validStatuses: readonly AppointmentStatus[] = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const updated = db.updateAppointmentStatus(id, status);
  if (!updated) {
    res.status(404).json({ error: `Appointment '${id}' not found.` });
    return;
  }
  res.json(updated);
});
