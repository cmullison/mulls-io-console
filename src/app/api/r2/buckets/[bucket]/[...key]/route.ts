import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CloudflareEnv, getBucketBinding } from '@/lib/r2-bindings';
import { getSessionFromCookie } from "@/utils/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  // Check authentication
  const session = await getSessionFromCookie();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { env } = getCloudflareContext();
    const typedEnv = env as unknown as CloudflareEnv;
    const resolvedParams = await params;
    const bucket = getBucketBinding(typedEnv, resolvedParams.bucket);

    if (!bucket) {
      return NextResponse.json({ error: `R2 bucket '${resolvedParams.bucket}' not found` }, { status: 404 });
    }

    const key = resolvedParams.key.join('/');

        // Check for range request
    const rangeHeader = request.headers.get('range');
    let object;
    let status = 200;
    const responseHeaders = new Headers();

    if (rangeHeader) {
      // Parse range header (e.g., "bytes=0-1023")
      const matches = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (matches) {
        const start = matches[1] ? parseInt(matches[1]) : 0;
        const end = matches[2] ? parseInt(matches[2]) : undefined;

        // Get object metadata first to determine file size
        const objectMeta = await bucket.head(key);
        if (!objectMeta) {
          return NextResponse.json({ error: 'Object not found' }, { status: 404 });
        }

        // Calculate proper range values
        const fileSize = objectMeta.size;
        const rangeStart = start;
        const rangeEnd = end !== undefined ? Math.min(end, fileSize - 1) : fileSize - 1;
        const rangeLength = rangeEnd - rangeStart + 1;

        // Get object with range (only if length is positive)
        if (rangeLength > 0) {
          object = await bucket.get(key, {
            range: { offset: rangeStart, length: rangeLength }
          });

          if (object) {
            status = 206; // Partial Content
            responseHeaders.set('Content-Range', `bytes ${rangeStart}-${rangeEnd}/${fileSize}`);
            responseHeaders.set('Content-Length', rangeLength.toString());
          }
        }
      }
    }

    if (!object) {
      object = await bucket.get(key);
      if (!object) {
        return NextResponse.json({ error: 'Object not found' }, { status: 404 });
      }
    }

    // Set content headers
    responseHeaders.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    if (status === 200) {
      responseHeaders.set('Content-Length', object.size.toString());
    }
    responseHeaders.set('ETag', object.etag);
    responseHeaders.set('Last-Modified', object.uploaded.toUTCString());

    // Enable range requests for media files
    const contentType = object.httpMetadata?.contentType || '';
    if (contentType.startsWith('video/') || contentType.startsWith('audio/')) {
      responseHeaders.set('Accept-Ranges', 'bytes');
      responseHeaders.set('Cache-Control', 'public, max-age=3600');
    }

    // CORS headers for media playback
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    // Add custom metadata as headers
    if (object.customMetadata) {
      for (const [key, value] of Object.entries(object.customMetadata)) {
        responseHeaders.set(`x-r2-metadata-${key}`, value);
      }
    }

    return new Response(object.body, {
      status,
      headers: responseHeaders
    });
  } catch (error) {
    console.error('Error getting object:', error);
    return NextResponse.json({ error: 'Failed to get object' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string; key: string[] }> }
) {
  // Check authentication
  const session = await getSessionFromCookie();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  // Check authentication
  const session = await getSessionFromCookie();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }

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

    // Enable range requests for media files
    const contentType = object.httpMetadata?.contentType || '';
    if (contentType.startsWith('video/') || contentType.startsWith('audio/')) {
      headers.set('Accept-Ranges', 'bytes');
    }

    // CORS headers for media playback
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length');
    headers.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

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

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length, Authorization');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(null, { status: 200, headers });
}