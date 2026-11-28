import { Hono } from 'hono';
import { signS3Request } from '../lib/s3-tigris';
import { parseJson, type AppContext } from '../types';

const mediaCacheWorker = new Map<string, { buffer: Uint8Array; mimeType: string }>();

export const mediaRoutes = new Hono<AppContext>();

mediaRoutes.post('/upload', async (c) => {
  const body = await parseJson<{
    imageBase64?: string;
    filename?: string;
    mimeType?: string;
  }>(c.req.raw);

  if (!body.imageBase64) {
    return c.json({ error: 'Missing imageBase64 payload.' }, 400);
  }

  const raw = body.imageBase64;
  const matches = raw.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : body.mimeType || 'image/webp';
  const base64Data = matches ? matches[2] : raw;

  const binaryString = atob(base64Data);
  const buffer = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    buffer[i] = binaryString.charCodeAt(i);
  }

  const extension = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
  const fileKey = `avatar-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;

  if (c.env.TIGRIS_ACCESS_KEY_ID && c.env.TIGRIS_SECRET_ACCESS_KEY && c.env.TIGRIS_BUCKET) {
    const endpoint = c.env.TIGRIS_ENDPOINT || 'https://t3.storage.dev';
    const region = c.env.TIGRIS_REGION || 'auto';
    const uploadUrl = `${endpoint}/${c.env.TIGRIS_BUCKET}/${fileKey}`;
    const signedHeaders = await signS3Request({
      method: 'PUT',
      url: uploadUrl,
      region,
      accessKeyId: c.env.TIGRIS_ACCESS_KEY_ID,
      secretAccessKey: c.env.TIGRIS_SECRET_ACCESS_KEY,
      contentType: mimeType,
      body: buffer,
    });
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { ...signedHeaders, 'Content-Type': mimeType },
      body: buffer,
    });
    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      return c.json({ error: `Tigris upload failed: ${errText}` }, 502);
    }
  } else {
    mediaCacheWorker.set(fileKey, { buffer, mimeType });
  }

  const mediaUrl = `${new URL(c.req.url).origin}/api/media/${fileKey}`;
  return c.json(
    {
      success: true,
      key: fileKey,
      url: mediaUrl,
      sizeBytes: buffer.byteLength,
      mimeType,
    },
    201
  );
});

mediaRoutes.get('/media/:key', async (c) => {
  const key = c.req.param('key').trim();

  if (c.env.TIGRIS_ACCESS_KEY_ID && c.env.TIGRIS_SECRET_ACCESS_KEY && c.env.TIGRIS_BUCKET) {
    const endpoint = c.env.TIGRIS_ENDPOINT || 'https://t3.storage.dev';
    const region = c.env.TIGRIS_REGION || 'auto';
    const objectUrl = `${endpoint}/${c.env.TIGRIS_BUCKET}/${key}`;
    const signedHeaders = await signS3Request({
      method: 'GET',
      url: objectUrl,
      region,
      accessKeyId: c.env.TIGRIS_ACCESS_KEY_ID,
      secretAccessKey: c.env.TIGRIS_SECRET_ACCESS_KEY,
    });
    const res = await fetch(objectUrl, { method: 'GET', headers: signedHeaders });
    if (res.ok) {
      const headers = new Headers();
      headers.set('Content-Type', res.headers.get('Content-Type') || 'image/webp');
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      const etag = res.headers.get('ETag');
      if (etag) headers.set('ETag', etag);
      return new Response(res.body, { headers });
    }
  }

  const cached = mediaCacheWorker.get(key);
  if (cached) {
    return new Response(cached.buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': cached.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  return c.json({ error: `Media asset '${key}' not found.` }, 404);
});
