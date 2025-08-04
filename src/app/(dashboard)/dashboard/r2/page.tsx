import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import PageBanner from "@/components/page-banner";
import { R2FileBrowser } from "@/components/r2/r2-file-browser";

export const metadata: Metadata = {
  title: "R2 Storage",
  description: "Browse and manage your Cloudflare R2 storage files",
  openGraph: {
    title: "R2 Storage - Mulls.io Console",
    description: "Browse and manage your Cloudflare R2 storage files",
    images: [
      "/api/og?title=R2%20Storage&description=Browse%20and%20manage%20your%20Cloudflare%20R2%20storage%20files&type=dashboard",
    ],
  },
  twitter: {
    title: "R2 Storage - Mulls.io Console",
    description: "Browse and manage your Cloudflare R2 storage files",
    images: [
      "/api/og?title=R2%20Storage&description=Browse%20and%20manage%20your%20Cloudflare%20R2%20storage%20files&type=dashboard",
    ],
  },
};

export default function R2Page() {
  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard",
            label: "Dashboard",
          },
          {
            href: "/dashboard/r2",
            label: "R2 Storage",
          },
        ]}
      />
      <PageBanner
        bannerTitle="R2 Storage"
        bannerDescription="Browse and manage your Cloudflare R2 storage files"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <R2FileBrowser />
      </div>
    </>
  );
}