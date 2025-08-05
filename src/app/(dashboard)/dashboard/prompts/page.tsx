import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import PageBanner from "@/components/page-banner";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Monitor and configure your Mulls.io services",
  openGraph: {
    title: "Dashboard - Mulls.io Console",
    description: "Monitor and configure your Mulls.io services",
    images: [
      "/api/og?title=Dashboard&description=Monitor%20and%20configure%20your%20Mulls.io%20services&type=dashboard",
    ],
  },
  twitter: {
    title: "Dashboard - Mulls.io Console",
    description: "Monitor and configure your Mulls.io services",
    images: [
      "/api/og?title=Dashboard&description=Monitor%20and%20configure%20your%20Mulls.io%20services&type=dashboard",
    ],
  },
};

export default function Page() {
  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard",
            label: "Dashboard",
          },
        ]}
      />
      <PageBanner
        bannerTitle="Dashboard"
        bannerDescription="Monitor and configure your services"
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0"></div>
    </>
  );
}
