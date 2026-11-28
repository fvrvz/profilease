/// <reference types="@cloudflare/workers-types" />

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  WHATSAPP_WEBHOOK_URL?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_ENV?: string;
  NODE_ENV?: string;
  PLATFORM_HOSTS?: string;
  PLATFORM_URL?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  TIGRIS_ACCESS_KEY_ID?: string;
  TIGRIS_SECRET_ACCESS_KEY?: string;
  TIGRIS_ENDPOINT?: string;
  TIGRIS_BUCKET?: string;
  TIGRIS_REGION?: string;
}

export type AppContext = {
  Bindings: Env;
};

export interface TestimonialItem {
  id: string;
  clientName: string;
  roleOrCondition: string;
  comment: string;
  rating: number;
  date: string;
}

export interface SocialLinkItem {
  platform: string;
  url: string;
}

export async function parseJson<T extends object>(request: Request): Promise<T> {
  try {
    return (await request.json<T>()) ?? ({} as T);
  } catch {
    return {} as T;
  }
}
