import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CloudflareEnv, getBucketBinding } from '@/lib/r2-bindings';
import { getSessionFromCookie } from "@/utils/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bucket: string }> }
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

    const formData = await request.formData();
    const uploadId = formData.get('uploadId') as string;
    const key = formData.get('key') as string;
    const partNumber = parseInt(formData.get('partNumber') as string);
    const chunk = formData.get('chunk') as File;

    if (!uploadId || !key || !partNumber || !chunk) {
      return NextResponse.json({
        error: 'uploadId, key, partNumber, and chunk are required'
      }, { status: 400 });
    }

    const arrayBuffer = await chunk.arrayBuffer();
    // @ts-expect-error - uploadPart is not a method of R2Bucket
    const uploadedPart = await bucket.uploadPart(key, uploadId, partNumber, arrayBuffer);

    return NextResponse.json({
      partNumber,
      etag: uploadedPart.etag,
    });
  } catch (error) {
    console.error('Error uploading part:', error);
    return NextResponse.json({ error: 'Failed to upload part' }, { status: 500 });
  }
}