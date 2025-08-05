import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import PageBanner from "@/components/page-banner";
import { R2FileBrowser } from "@/components/files/r2-file-browser";

export const metadata: Metadata = {
  title: "Files",
  description: "Browse and manage your files",
  openGraph: {
    title: "Files - Mulls.io Console",
    description: "Browse and manage your files",
    images: [
      "/api/og?title=Files&description=Browse%20and%20manage%20your%20files&type=dashboard",
    ],
  },
  twitter: {
    title: "Files - Mulls.io Console",
    description: "Browse and manage your files",
    images: [
      "/api/og?title=Files&description=Browse%20and%20manage%20your%20files&type=dashboard",
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
            href: "/dashboard/files",
            label: "Files",
          },
        ]}
      />
      <PageBanner
        bannerTitle="Files"
        bannerDescription="Browse and manage your files"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <R2FileBrowser />
      </div>
    </>
  );
}
