import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import PageBanner from "@/components/page-banner";
import { R2FileBrowser } from "@/components/r2/r2-file-browser";
import { r2Config } from "@/lib/r2-config";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { CloudflareEnv, getBucketBinding } from '@/lib/r2-bindings';

interface R2PathPageProps {
  params: Promise<{
    path: string[];
  }>;
}

// Server-side data fetching for initial file list (SSR)
async function getInitialFiles(path: string, bucketName: string = r2Config.defaultBucketName) {
  try {
    // This runs on the server during SSR
    const { env } = getCloudflareContext();
    const typedEnv = env as unknown as CloudflareEnv;
    const bucket = getBucketBinding(typedEnv, bucketName);

    if (!bucket) {
      return { files: [], folders: [], error: `R2 bucket '${bucketName}' not found` };
    }

    const prefix = path ? path + (path.endsWith("/") ? "" : "/") : "";

    const objects = await bucket.list({
      prefix,
      delimiter: "/",
    });

    const files = objects.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      lastModified: obj.uploaded,
      etag: obj.etag,
    }));

    const folders =
      objects.delimitedPrefixes?.map((prefix) => ({
        key: prefix,
        isFolder: true,
      })) || [];

    return { files, folders, truncated: objects.truncated };
  } catch (error) {
    console.error("SSR: Error loading files:", error);
    return { files: [], folders: [], error: "Failed to load files" };
  }
}

export async function generateMetadata({
  params,
}: R2PathPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const path = resolvedParams.path?.join("/") || "";
  const folderName = path
    ? path.split("/").filter(Boolean).pop() || "Root"
    : "Root";

  return {
    title: `${folderName} - R2 Storage`,
    description: `Browse files in ${folderName} folder`,
    openGraph: {
      title: `${folderName} - R2 Storage - Mulls.io Console`,
      description: `Browse files in ${folderName} folder`,
    },
  };
}

export default async function R2PathPage({ params }: R2PathPageProps) {
  const resolvedParams = await params;
  const path = resolvedParams.path?.join("/") || "";
  const folderName = path
    ? path.split("/").filter(Boolean).pop() || "Root"
    : "Root";

  // Server-side render initial data
  const initialData = await getInitialFiles(path);

  const breadcrumbItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/r2", label: "R2 Storage" },
  ];

  // Add path segments to breadcrumb
  if (path) {
    const pathSegments = path.split("/").filter(Boolean);
    pathSegments.forEach((segment, index) => {
      const href =
        "/dashboard/r2/" + pathSegments.slice(0, index + 1).join("/");
      breadcrumbItems.push({ href, label: segment });
    });
  }

  return (
    <>
      <PageHeader items={breadcrumbItems} />
      <PageBanner
        bannerTitle={`R2 Storage - ${folderName}`}
        bannerDescription={`Browse and manage files in ${
          folderName === "Root" ? "root directory" : folderName + " folder"
        }`}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {initialData.error ? (
          <div className="text-center py-8 text-destructive">
            {initialData.error}
          </div>
        ) : (
          <R2FileBrowser
            initialPath={path}
            // @ts-expect-error - initialData is not a valid type
            initialData={initialData}
          />
        )}
      </div>
    </>
  );
}
