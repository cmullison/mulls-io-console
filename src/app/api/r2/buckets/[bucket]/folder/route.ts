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

    const { path } = await request.json() as { path: string };

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Ensure path ends with / for folder marker
    const folderPath = path.endsWith('/') ? path : `${path}/`;

    // Create folder by putting an empty object with folder marker
    await bucket.put(`${folderPath}.folder`, '', {
      httpMetadata: {
        contentType: 'application/x-directory',
      },
      customMetadata: {
        'r2-explorer-folder': 'true',
      },
    });

    return NextResponse.json({
      success: true,
      path: folderPath,
    });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}