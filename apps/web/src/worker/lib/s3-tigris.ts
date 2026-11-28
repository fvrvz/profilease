export async function signS3Request(opts: {
  method: string;
  url: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  contentType?: string;
  body?: Uint8Array;
}): Promise<Record<string, string>> {
  const { method, url: rawUrl, region, accessKeyId, secretAccessKey, contentType, body } = opts;
  const parsed = new URL(rawUrl);
  const host = parsed.host;
  const pathname = parsed.pathname;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
  const dateStamp = amzDate.slice(0, 8);

  const payloadBytes = body ? new Uint8Array(body) : new Uint8Array(0);
  const payloadHashBuf = await crypto.subtle.digest('SHA-256', payloadBytes);
  const payloadHash = Array.from(new Uint8Array(payloadHashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const headers: Record<string, string> = {
    host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  };
  if (contentType) headers['content-type'] = contentType;

  const sortedHeaderKeys = Object.keys(headers).sort();
  const canonicalHeaders = sortedHeaderKeys.map((k) => `${k}:${headers[k]}\n`).join('');
  const signedHeaders = sortedHeaderKeys.join(';');

  const canonicalRequest = [
    method.toUpperCase(),
    pathname,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const canonicalHashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest));
  const canonicalHash = Array.from(new Uint8Array(canonicalHashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${canonicalHash}`;

  const enc = new TextEncoder();
  const hmac = async (key: ArrayBuffer, data: string) =>
    crypto.subtle.sign(
      'HMAC',
      await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      enc.encode(data)
    );

  const kDate = await hmac(enc.encode(`AWS4${secretAccessKey}`).buffer as ArrayBuffer, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, 's3');
  const kSigning = await hmac(kService, 'aws4_request');
  const sigBuf = await hmac(kSigning, stringToSign);
  const signature = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const result: Record<string, string> = {
    Authorization: authorization,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
  };
  if (contentType) result['Content-Type'] = contentType;
  return result;
}
