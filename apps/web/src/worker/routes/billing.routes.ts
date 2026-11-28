import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '../db/schema';
import { profiles } from '../db/schema';
import { capturePayPalOrder, createPayPalCheckoutOrder } from '../services/paypal.service';
import { parseJson, type AppContext } from '../types';

export const billingRoutes = new Hono<AppContext>();

billingRoutes.post('/paypal/create-order', async (c) => {
  const body = await parseJson<{
    planId?: string;
    billingCycle?: 'yearly' | 'half_yearly';
    amountUsd?: number;
    cancelPath?: string;
  }>(c.req.raw);

  const result = await createPayPalCheckoutOrder({
    env: c.env,
    origin: new URL(c.req.url).origin,
    planId: body.planId,
    billingCycle: body.billingCycle,
    amountUsd: Number(body.amountUsd || 20),
    cancelPath: body.cancelPath,
  });

  return c.json(result);
});

billingRoutes.post('/paypal/capture-order', async (c) => {
  const body = await parseJson<{
    orderId?: string;
    planId?: string;
    profileId?: string;
    email?: string;
  }>(c.req.raw);

  if (!body.orderId) {
    return c.json({ error: 'Missing PayPal orderId.' }, 400);
  }

  try {
    const capture = await capturePayPalOrder({
      env: c.env,
      orderId: body.orderId.trim(),
    });

    if (!capture.captured) {
      return c.json(
        { success: false, status: capture.status, orderId: capture.orderId, error: 'Payment not completed.' },
        402
      );
    }

    const plan = body.planId === 'mid' || body.planId === 'pro' ? body.planId : 'basic';
    const db = drizzle(c.env.DB, { schema });

    if (body.profileId) {
      await db
        .update(profiles)
        .set({ subscriptionPlan: plan, subscriptionStatus: 'active' })
        .where(eq(profiles.id, body.profileId.trim()));
    } else if (body.email) {
      const cleanEmail = body.email.trim().toLowerCase();
      await db
        .update(profiles)
        .set({ subscriptionPlan: plan, subscriptionStatus: 'active' })
        .where(sql`LOWER(${profiles.email}) = ${cleanEmail}`);
    }

    return c.json({
      success: true,
      orderId: capture.orderId,
      status: capture.status,
      plan,
    });
  } catch (err) {
    console.error('PayPal capture-order error:', err);
    return c.json({ error: 'Failed to capture PayPal order.' }, 502);
  }
});
