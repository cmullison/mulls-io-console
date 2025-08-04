import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CloudflareEnv, getBucketBinding } from '@/lib/r2-bindings';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
) {
  try {
    const { env } = getCloudflareContext();
    const typedEnv = env as unknown as CloudflareEnv;
    const resolvedParams = await params;
    const bucket = getBucketBinding(typedEnv, resolvedParams.bucket);

    if (!bucket) {
      return NextResponse.json({ error: `R2 bucket '${resolvedParams.bucket}' not found` }, { status: 404 });
    }

    const { key, contentType, metadata } = await request.json() as { key: string, contentType: string, metadata: Record<string, string> };

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }

    const multipartUpload = await bucket.createMultipartUpload(key, {
      httpMetadata: {
        contentType: contentType || 'application/octet-stream',
      },
      customMetadata: metadata || {},
    });

    return NextResponse.json({
      uploadId: multipartUpload.uploadId,
      key,
    });
  } catch (error) {
    console.error('Error creating multipart upload:', error);
    return NextResponse.json({ error: 'Failed to create multipart upload' }, { status: 500 });
  }
}