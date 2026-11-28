import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { profiles } from '../db/schema';
import { formatProfileWithRelations } from '../db/profile.mapper';
import { hashPassword, verifyPassword } from '../lib/crypto';
import { dispatchPasswordResetEmail } from '../services/email.service';
import { parseJson, type AppContext } from '../types';

export const authRoutes = new Hono<AppContext>();

authRoutes.post('/admin/login', async (c) => {
  const body = await parseJson<{ email?: string; password?: string }>(c.req.raw);
  const validEmail = c.env.ADMIN_EMAIL || 'admin@profilease.io';
  const validPass = c.env.ADMIN_PASSWORD || 'admin123';

  if (
    body.email?.toLowerCase().trim() === validEmail.toLowerCase() &&
    body.password === validPass
  ) {
    return c.json({
      success: true,
      token: 'prof-admin-token-supersecure-2026',
      username: 'System Administrator',
    });
  }

  return c.json({ error: 'Invalid admin credentials' }, 401);
});

authRoutes.post('/client/login', async (c) => {
  const body = await parseJson<{ email?: string; accessKey?: string }>(c.req.raw);
  if (!body.email || !body.accessKey) {
    return c.json({ error: 'Missing client email or access key' }, 400);
  }

  const cleanEmail = body.email.trim().toLowerCase();
  const key = body.accessKey.trim();
  const db = drizzle(c.env.DB, { schema });

  const row = await db
    .select()
    .from(profiles)
    .where(sql`LOWER(${profiles.email}) = ${cleanEmail}`)
    .get();

  if (!row) {
    return c.json({ error: 'Invalid client credentials or unauthorized profile.' }, 401);
  }

  const isLegacyDemoAlias =
    (cleanEmail === 'contact@drelenavance.com' && (key === 'vance2026' || key === 'elena2026')) ||
    (cleanEmail === 'marcus@chenphysics.edu' && (key === 'chen2026' || key === 'marcus2026'));

  const validPassword = isLegacyDemoAlias || (await verifyPassword(key, row.clientAccessKey));
  if (!validPassword) {
    return c.json({ error: 'Invalid client credentials or unauthorized profile.' }, 401);
  }

  if (!row.clientAccessKey.startsWith('sha256$') && !isLegacyDemoAlias) {
    const upgradedHash = await hashPassword(key);
    await db
      .update(profiles)
      .set({ clientAccessKey: upgradedHash })
      .where(eq(profiles.id, row.id));
  }

  const profile = await formatProfileWithRelations(row, db);
  return c.json({
    success: true,
    token: `client-token-${profile.id}-${Date.now()}`,
    profile,
  });
});

authRoutes.post('/client/change-password', async (c) => {
  const body = await parseJson<{
    profileId?: string;
    currentPassword?: string;
    newPassword?: string;
  }>(c.req.raw);

  if (!body.profileId || !body.currentPassword || !body.newPassword) {
    return c.json({ error: 'Missing required password fields.' }, 400);
  }
  if (body.newPassword.trim().length < 8) {
    return c.json({ error: 'New password must be at least 8 characters.' }, 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const row = await db.select().from(profiles).where(eq(profiles.id, body.profileId)).get();

  if (!row || !(await verifyPassword(body.currentPassword.trim(), row.clientAccessKey))) {
    return c.json({ error: 'Current temporary password is incorrect.' }, 401);
  }

  const newHash = await hashPassword(body.newPassword.trim());
  await db
    .update(profiles)
    .set({ clientAccessKey: newHash, mustChangePassword: 0 })
    .where(eq(profiles.id, body.profileId));

  const updated = await db.select().from(profiles).where(eq(profiles.id, body.profileId)).get();
  if (!updated) {
    return c.json({ error: 'Profile not found after update.' }, 404);
  }

  return c.json({ success: true, profile: await formatProfileWithRelations(updated, db) });
});

authRoutes.post('/client/forgot-password', async (c) => {
  const body = await parseJson<{ email?: string }>(c.req.raw);
  if (!body.email) {
    return c.json({ error: 'Email address is required.' }, 400);
  }

  const cleanEmail = body.email.trim().toLowerCase();
  const db = drizzle(c.env.DB, { schema });
  const row = await db
    .select({ id: profiles.id, name: profiles.name, email: profiles.email })
    .from(profiles)
    .where(sql`LOWER(${profiles.email}) = ${cleanEmail}`)
    .get();

  if (row) {
    const resetToken = `rst-${crypto.randomUUID().replace(/-/g, '')}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db
      .update(profiles)
      .set({ passwordResetToken: resetToken, passwordResetExpiresAt: expiresAt })
      .where(eq(profiles.id, row.id));

    const resetUrl = `${new URL(c.req.url).origin}/portal/reset-password?token=${resetToken}`;
    c.executionCtx.waitUntil(
      dispatchPasswordResetEmail({
        env: c.env,
        email: row.email,
        name: row.name,
        resetUrl,
      })
    );
  }

  return c.json({
    success: true,
    message: 'If an account matches that email, a password reset link has been sent.',
  });
});

authRoutes.post('/client/reset-password', async (c) => {
  const body = await parseJson<{ token?: string; newPassword?: string }>(c.req.raw);
  if (!body.token || !body.newPassword) {
    return c.json({ error: 'Missing reset token or new password.' }, 400);
  }
  if (body.newPassword.trim().length < 8) {
    return c.json({ error: 'New password must be at least 8 characters.' }, 400);
  }

  const db = drizzle(c.env.DB, { schema });
  const row = await db
    .select()
    .from(profiles)
    .where(eq(profiles.passwordResetToken, body.token.trim()))
    .get();

  if (
    !row ||
    !row.passwordResetExpiresAt ||
    new Date(row.passwordResetExpiresAt).getTime() < Date.now()
  ) {
    return c.json({ error: 'Invalid or expired password reset link.' }, 400);
  }

  const newHash = await hashPassword(body.newPassword.trim());
  await db
    .update(profiles)
    .set({
      clientAccessKey: newHash,
      mustChangePassword: 0,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    })
    .where(eq(profiles.id, row.id));

  return c.json({
    success: true,
    message: 'Password has been reset successfully. You can now log in.',
  });
});
