import { Hono } from 'hono';
import { createPayPalCheckoutOrder } from '../services/paypal.service';
import { parseJson, type AppContext } from '../types';

export const billingRoutes = new Hono<AppContext>();

billingRoutes.post('/paypal/create-order', async (c) => {
  const body = await parseJson<{
    planId?: string;
    billingCycle?: 'yearly' | 'half_yearly';
    amountUsd?: number;
  }>(c.req.raw);

  const result = await createPayPalCheckoutOrder({
    env: c.env,
    origin: new URL(c.req.url).origin,
    planId: body.planId,
    billingCycle: body.billingCycle,
    amountUsd: Number(body.amountUsd || 20),
  });

  return c.json(result);
});
