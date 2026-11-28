import { Resend } from 'resend';
import type { Env } from '../types';

export async function dispatchOnboardingNotifications(params: {
  env: Env;
  origin: string;
  name: string;
  email: string;
  phone: string;
  slug: string;
  customDomain: string | null;
  tempPassword: string;
}): Promise<void> {
  const previewUrl = params.customDomain
    ? `https://${params.customDomain}`
    : `${params.origin}/@${params.slug}`;
  const portalUrl = `${params.origin}/portal/login`;

  const whatsappText = `Onboarding done! Welcome to Profilease, ${params.name}. Live preview: ${previewUrl}. Check your registered email (${params.email}) for your Practitioner Portal credentials.`;
  if (params.phone) {
    if (params.env.WHATSAPP_WEBHOOK_URL) {
      try {
        await fetch(params.env.WHATSAPP_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: params.phone, message: whatsappText }),
        });
      } catch (err) {
        console.error('WhatsApp onboarding webhook error:', err);
      }
    } else {
      console.log(`[WHATSAPP ONBOARDING] To: ${params.phone} | ${whatsappText}`);
    }
  }

  const apiKey = params.env.RESEND_API_KEY;
  if (!apiKey || !params.email) return;

  const resend = new Resend(apiKey);
  const fromEmail = params.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    await resend.emails.send({
      from: `Profilease <${fromEmail}>`,
      to: [params.email],
      subject: `Welcome to Profilease, ${params.name} — Your Portal Credentials`,
      html: `
        <div style="font-family: monospace; padding: 24px; border: 2px solid #0a0a0a; max-width: 540px;">
          <h2 style="text-transform: uppercase; margin-top: 0;">Welcome to Profilease</h2>
          <p>Hi <strong>${params.name}</strong>, your onboarding is complete and your live portfolio is ready:</p>
          <p><a href="${previewUrl}">${previewUrl}</a></p>
          <div style="background: #f4f4f5; border: 1px solid #d4d4d8; padding: 14px; margin: 18px 0;">
            <div><strong>Portal URL:</strong> <a href="${portalUrl}">${portalUrl}</a></div>
            <div><strong>Username (Email):</strong> ${params.email}</div>
            <div><strong>Temporary Password:</strong> ${params.tempPassword}</div>
          </div>
          <p style="font-size: 12px; color: #52525b;">For your security, you will be asked to set a new password immediately after logging in.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend onboarding email error:', err);
  }
}

export async function dispatchBookingEmails(params: {
  env: Env;
  professionalEmail: string;
  professionalName: string;
  clientEmail: string;
  clientName: string;
  serviceTitle: string;
  appointmentDate: string;
  appointmentTime: string;
  acceptUrl: string;
  declineUrl: string;
}): Promise<void> {
  const apiKey = params.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const fromEmail = params.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    await resend.emails.send({
      from: `Profilease <${fromEmail}>`,
      to: [params.professionalEmail],
      subject: `New Booking: ${params.clientName} - ${params.serviceTitle}`,
      html: `
        <div style="font-family: monospace; padding: 24px; border: 2px solid #0a0a0a; max-width: 500px;">
          <h2 style="text-transform: uppercase;">New Appointment Request</h2>
          <p><strong>${params.clientName}</strong> booked <strong>${params.serviceTitle}</strong>.</p>
          <p>Date: ${params.appointmentDate} at ${params.appointmentTime}</p>
          <div style="margin: 24px 0;">
            <a href="${params.acceptUrl}" style="background: #0d9488; color: #fff; padding: 10px 18px; text-decoration: none; font-weight: bold; margin-right: 12px; display: inline-block;">ACCEPT APPOINTMENT</a>
            <a href="${params.declineUrl}" style="background: #ef4444; color: #fff; padding: 10px 18px; text-decoration: none; font-weight: bold; display: inline-block;">DECLINE</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend dispatch error (professional):', err);
  }

  try {
    await resend.emails.send({
      from: `Profilease <${fromEmail}>`,
      to: [params.clientEmail],
      subject: `Appointment Received: ${params.serviceTitle} with ${params.professionalName}`,
      html: `
        <div style="font-family: monospace; padding: 24px; border: 2px solid #0a0a0a; max-width: 500px;">
          <h2 style="text-transform: uppercase;">Appointment Request Received</h2>
          <p>Hello ${params.clientName}, your request for <strong>${params.serviceTitle}</strong> with <strong>${params.professionalName}</strong> is being processed.</p>
          <p>Scheduled: ${params.appointmentDate} at ${params.appointmentTime}</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend dispatch error (client):', err);
  }
}

export async function dispatchPasswordResetEmail(params: {
  env: Env;
  email: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  if (!params.env.RESEND_API_KEY) return;
  const resend = new Resend(params.env.RESEND_API_KEY);
  const fromEmail = params.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    await resend.emails.send({
      from: `Profilease Security <${fromEmail}>`,
      to: [params.email],
      subject: 'Reset Your Profilease Practitioner Password',
      html: `
        <div style="font-family: monospace; padding: 24px; border: 2px solid #0a0a0a; max-width: 520px; background: #fff;">
          <h2 style="text-transform: uppercase; margin-top: 0;">Password Reset Request</h2>
          <p>Hello ${params.name},</p>
          <p>We received a request to reset your Practitioner Portal password. Click the button below within 1 hour to set a new password:</p>
          <p style="margin: 24px 0;">
            <a href="${params.resetUrl}" style="display: inline-block; padding: 12px 20px; background: #0a0a0a; color: #fff; text-decoration: none; font-weight: bold; text-transform: uppercase;">
              Reset Password →
            </a>
          </p>
          <p style="font-size: 11px; color: #737373;">If you did not request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Resend password reset email error:', err);
  }
}
