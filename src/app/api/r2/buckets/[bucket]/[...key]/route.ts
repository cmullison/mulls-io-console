import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CloudflareEnv, getBucketBinding } from '@/lib/r2-bindings';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  try {
    const { env } = getCloudflareContext();
    const typedEnv = env as unknown as CloudflareEnv;
    const resolvedParams = await params;
    const bucket = getBucketBinding(typedEnv, resolvedParams.bucket);

    if (!bucket) {
      return NextResponse.json({ error: `R2 bucket '${resolvedParams.bucket}' not found` }, { status: 404 });
    }

    const key = resolvedParams.key.join('/');
    const object = await bucket.get(key);

    if (!object) {
      return NextResponse.json({ error: 'Object not found' }, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Length', object.size.toString());
    headers.set('ETag', object.etag);
    headers.set('Last-Modified', object.uploaded.toUTCString());

    // Add custom metadata as headers
    if (object.customMetadata) {
      for (const [key, value] of Object.entries(object.customMetadata)) {
        headers.set(`x-r2-metadata-${key}`, value);
      }
    }

    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error getting object:', error);
    return NextResponse.json({ error: 'Failed to get object' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  try {
    const { env } = getCloudflareContext();
    const typedEnv = env as unknown as CloudflareEnv;
    const resolvedParams = await params;
    const bucket = getBucketBinding(typedEnv, resolvedParams.bucket);

    if (!bucket) {
      return NextResponse.json({ error: `R2 bucket '${resolvedParams.bucket}' not found` }, { status: 404 });
    }

    const key = resolvedParams.key.join('/');
    await bucket.delete(key);

    return NextResponse.json({ success: true, deleted: key });
  } catch (error) {
    console.error('Error deleting object:', error);
    return NextResponse.json({ error: 'Failed to delete object' }, { status: 500 });
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  try {
    const { env } = getCloudflareContext();
    const typedEnv = env as unknown as CloudflareEnv;
    const resolvedParams = await params;
    const bucket = getBucketBinding(typedEnv, resolvedParams.bucket);

    if (!bucket) {
      return new Response(null, { status: 404 });
    }

    const key = resolvedParams.key.join('/');
    const object = await bucket.head(key);

    if (!object) {
      return new Response(null, { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Content-Length', object.size.toString());
    headers.set('ETag', object.etag);
    headers.set('Last-Modified', object.uploaded.toUTCString());

    // Add custom metadata as headers
    if (object.customMetadata) {
      for (const [key, value] of Object.entries(object.customMetadata)) {
        headers.set(`x-r2-metadata-${key}`, value);
      }
    }

    return new Response(null, { headers });
  } catch (error) {
    console.error('Error getting object metadata:', error);
    return new Response(null, { status: 500 });
  }
}