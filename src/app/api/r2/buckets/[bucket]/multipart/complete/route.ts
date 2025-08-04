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

    const { uploadId, key, parts } = await request.json() as { uploadId: string, key: string, parts: { partNumber: number, etag: string }[] };

    if (!uploadId || !key || !parts || !Array.isArray(parts)) {
      return NextResponse.json({
        error: 'uploadId, key, and parts array are required'
      }, { status: 400 });
    }

    // Validate parts structure
    for (const part of parts) {
      if (!part.partNumber || !part.etag) {
        return NextResponse.json({
          error: 'Each part must have partNumber and etag'
        }, { status: 400 });
      }
    }

    // @ts-expect-error - completeMultipartUpload is not a method of R2Bucket
    const completedUpload = await bucket.completeMultipartUpload(key, uploadId, parts);

    return NextResponse.json({
      success: true,
      key,
      etag: completedUpload.etag,
    });
  } catch (error) {
    console.error('Error completing multipart upload:', error);
    return NextResponse.json({ error: 'Failed to complete multipart upload' }, { status: 500 });
  }
}