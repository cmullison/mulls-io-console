import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CloudflareEnv, getBucketBinding } from '@/lib/r2-bindings';
import { getSessionFromCookie } from "@/utils/auth";


export async function GET(
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

    const url = new URL(request.url);
    const prefix = url.searchParams.get('prefix') || '';
    const delimiter = url.searchParams.get('delimiter') || '/';

    const objects = await bucket.list({
      prefix,
      delimiter,
    });

    const files = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      lastModified: obj.uploaded,
      etag: obj.etag,
    }));

    const folders = objects.delimitedPrefixes?.map(prefix => ({
      key: prefix,
      isFolder: true,
    })) || [];

    return NextResponse.json({
      files,
      folders,
      truncated: objects.truncated,
    });
  } catch (error) {
    console.error('Error listing objects:', error);
    return NextResponse.json({ error: 'Failed to list objects' }, { status: 500 });
  }
}