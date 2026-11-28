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
    const apiBase =
      params.env.PAYPAL_ENV === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
    const authHeader = btoa(`${params.env.PAYPAL_CLIENT_ID}:${params.env.PAYPAL_CLIENT_SECRET}`);

    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (tokenRes.ok) {
      const tokenData = (await tokenRes.json()) as { access_token?: string };
      if (tokenData.access_token) {
        const orderRes = await fetch(`${apiBase}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
              {
                description,
                amount: {
                  currency_code: 'USD',
                  value: amountUsd.toFixed(2),
                },
              },
            ],
            application_context: {
              return_url: `${params.origin}/portal/login`,
              cancel_url: `${params.origin}/#pricing`,
            },
          }),
        });
        if (orderRes.ok) {
          const orderData = (await orderRes.json()) as {
            id?: string;
            links?: Array<{ rel: string; href: string }>;
          };
          const approveUrl = orderData.links?.find((l) => l.rel === 'approve')?.href;
          if (approveUrl && orderData.id) {
            return { orderId: orderData.id, approveUrl };
          }
        }
      }
    }
  }

  return {
    orderId: `pp-fallback-${Date.now()}`,
    approveUrl: `https://www.paypal.com/paypalme/fvrvz/${amountUsd.toFixed(2)}`,
    fallback: true,
  };
}
