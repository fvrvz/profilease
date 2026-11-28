import {
  CheckoutPaymentIntent,
  Client,
  Environment,
  OrdersController,
} from '@paypal/paypal-server-sdk';
import type { Env } from '../types';

export async function createPayPalCheckoutOrder(params: {
  env: Env;
  origin: string;
  planId?: string;
  billingCycle?: 'yearly' | 'half_yearly';
  amountUsd: number;
}): Promise<{ orderId: string; approveUrl: string; fallback?: boolean }> {
  const amountUsd = Math.max(1, Number(params.amountUsd || 20));
  const description = `Profilease ${params.planId || 'basic'} (${params.billingCycle || 'yearly'})`;

  if (params.env.PAYPAL_CLIENT_ID && params.env.PAYPAL_CLIENT_SECRET) {
    try {
      const client = new Client({
        clientCredentialsAuthCredentials: {
          oAuthClientId: params.env.PAYPAL_CLIENT_ID,
          oAuthClientSecret: params.env.PAYPAL_CLIENT_SECRET,
        },
        environment:
          params.env.PAYPAL_ENV === 'live' ? Environment.Production : Environment.Sandbox,
      });

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
            returnUrl: `${params.origin}/portal/login`,
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
