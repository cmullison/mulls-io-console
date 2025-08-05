import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CloudflareEnv, getBucketBinding } from '@/lib/r2-bindings';
import { getSessionFromCookie } from "@/utils/auth";

interface R2Object {
  key: string;
  size?: number;
  lastModified?: Date;
  etag?: string;
  isFolder?: boolean;
}

type SortBy = 'name' | 'size' | 'date' | 'type';
type SortOrder = 'asc' | 'desc';

function sortObjects(objects: R2Object[], sortBy: SortBy, sortOrder: SortOrder): R2Object[] {
  return objects.sort((a, b) => {
    let comparison = 0;

    // Always prioritize folders first, regardless of sort
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;

    switch (sortBy) {
      case 'name':
        comparison = (a.key || '').localeCompare(b.key || '');
        break;
      case 'size':
        comparison = (a.size || 0) - (b.size || 0);
        break;
      case 'date':
        const aDate = a.lastModified ? new Date(a.lastModified).getTime() : 0;
        const bDate = b.lastModified ? new Date(b.lastModified).getTime() : 0;
        comparison = aDate - bDate;
        break;
      case 'type':
        const aExt = a.key?.split('.').pop()?.toLowerCase() || '';
        const bExt = b.key?.split('.').pop()?.toLowerCase() || '';
        comparison = aExt.localeCompare(bExt);
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

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
    const maxKeys = Math.min(parseInt(url.searchParams.get('maxKeys') || '25'), 100); // Cap at 100
    const cursor = url.searchParams.get('cursor') || undefined;
    const sortBy = (url.searchParams.get('sortBy') || 'name') as SortBy;
    const sortOrder = (url.searchParams.get('sortOrder') || 'asc') as SortOrder;

    const objects = await bucket.list({
      prefix,
      delimiter,
      limit: maxKeys,
      cursor,
    });

    let files = objects.objects.map(obj => ({
      key: obj.key,
      size: obj.size,
      lastModified: obj.uploaded,
      etag: obj.etag,
    }));

    let folders = objects.delimitedPrefixes?.map(prefix => ({
      key: prefix,
      isFolder: true,
    })) || [];

    // Combine and sort all objects
    const allObjects = [...folders, ...files];
    const sortedObjects = sortObjects(allObjects, sortBy, sortOrder);

    // Separate back into files and folders after sorting
    const sortedFiles = sortedObjects.filter(obj => !obj.isFolder);
    const sortedFolders = sortedObjects.filter(obj => obj.isFolder);

    // Type-safe assignment
    files = sortedFiles.map(obj => ({
      key: obj.key,
      size: obj.size || 0,
      lastModified: obj.lastModified || new Date(),
      etag: obj.etag || '',
    }));
    folders = sortedFolders.map(obj => ({
      key: obj.key,
      isFolder: true,
    }));

    return NextResponse.json({
      files,
      folders,
      truncated: objects.truncated,
      pagination: {
        hasMore: objects.truncated,
        cursor: objects.truncated ? (objects as any).cursor : undefined,
        pageSize: maxKeys,
        totalEstimate: objects.truncated ? maxKeys + 1 : (files.length + folders.length),
      },
    });
  } catch (error) {
    console.error('Error listing objects:', error);
    return NextResponse.json({ error: 'Failed to list objects' }, { status: 500 });
  }
}