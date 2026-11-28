import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrdersController,
} from '@paypal/paypal-server-sdk';
import type { Env } from '../types';

function createPayPalClient(env: Env): Client | null {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    return null;
  }
  return new Client({
    clientCredentialsAuthCredentials: {
      oAuthClientId: env.PAYPAL_CLIENT_ID,
      oAuthClientSecret: env.PAYPAL_CLIENT_SECRET,
    },
    environment: env.PAYPAL_ENV === 'live' ? Environment.Production : Environment.Sandbox,
  });
}

export async function createPayPalCheckoutOrder(params: {
  env: Env;
  origin: string;
  planId?: string;
  billingCycle?: 'yearly' | 'half_yearly';
  amountUsd: number;
}): Promise<{ orderId: string; approveUrl: string; fallback?: boolean }> {
  const amountUsd = Math.max(1, Number(params.amountUsd || 20));
  const normalizedPlan = params.planId === 'mid' || params.planId === 'pro' ? params.planId : 'basic';
  const description = `Profilease ${normalizedPlan} (${params.billingCycle || 'yearly'})`;

  const client = createPayPalClient(params.env);
  if (client) {
    try {
      const ordersController = new OrdersController(client);
      const { result } = await ordersController.createOrder({
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              description,
              amount: {
                currencyCode: 'USD',
                value: amountUsd.toFixed(2),
              },
            },
          ],
          applicationContext: {
            returnUrl: `${params.origin}/billing/paypal/return?plan=${normalizedPlan}`,
            cancelUrl: `${params.origin}/#pricing`,
          },
        },
      });

      const approveUrl = result.links?.find((l) => l.rel === 'approve')?.href;
      if (approveUrl && result.id) {
        return { orderId: result.id, approveUrl };
      }
    } catch (err) {
      console.error('PayPal SDK createOrder error:', err);
    }
  }

  return {
    orderId: `pp-fallback-${Date.now()}`,
    approveUrl: `https://www.paypal.com/paypalme/fvrvz/${amountUsd.toFixed(2)}`,
    fallback: true,
  };
}

export async function capturePayPalOrder(params: {
  env: Env;
  orderId: string;
}): Promise<{ captured: boolean; status: string; orderId: string }> {
  const client = createPayPalClient(params.env);
  if (!client) {
    return { captured: false, status: 'PAYPAL_NOT_CONFIGURED', orderId: params.orderId };
  }

  const ordersController = new OrdersController(client);
  const { result } = await ordersController.captureOrder({
    id: params.orderId,
    prefer: 'return=representation',
  });

  const status = result.status || 'UNKNOWN';
  return {
    captured: status === 'COMPLETED',
    status,
    orderId: result.id || params.orderId,
  };
}
