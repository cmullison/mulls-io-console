import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Monitor and configure your Mulls.io services",
  openGraph: {
    title: "Dashboard - Mulls.io Console",
    description: "Monitor and configure your Mulls.io services",
    images: ["/api/og?title=Dashboard&description=Monitor%20and%20configure%20your%20Mulls.io%20services&type=dashboard"],
  },
  twitter: {
    title: "Dashboard - Mulls.io Console",
    description: "Monitor and configure your Mulls.io services",
    images: ["/api/og?title=Dashboard&description=Monitor%20and%20configure%20your%20Mulls.io%20services&type=dashboard"],
  },
};

export default function Page() {
  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard",
            label: "Dashboard"
          }
        ]}
      />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
            Example
          </div>
          <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
            Example
          </div>
          <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
            Example
          </div>
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min flex items-center justify-center">
          Example
        </div>
      </div>
    </>
  )
}
