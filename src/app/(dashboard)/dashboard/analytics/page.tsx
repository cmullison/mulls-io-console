"use client";
import { PageHeader } from "@/components/page-header";
import PageBanner from "@/components/page-banner";
import { AnalyticsDashboard } from "./analytics-dashboard";

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard",
            label: "Dashboard",
          },
          {
            href: "/dashboard/analytics",
            label: "Analytics",
          },
        ]}
      />
      <PageBanner
        bannerTitle="Analytics"
        bannerDescription="View your analytics data"
      />
      <div className="space-y-6">
        <AnalyticsDashboard />
      </div>
    </>
  );
}
