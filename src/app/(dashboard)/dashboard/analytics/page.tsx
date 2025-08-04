"use client";
import TimeSeriesChart from "./components/TimeSeriesChart";
import TableCard from "./components/TableCard";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import PageBanner from "@/components/page-banner";

export default function AnalyticsDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Analytics Page] Starting fetch...");
    setLoading(true);

    // Fetch from your API route
    fetch("/api/analytics?endpoint=stats&siteId=mulls-io")
      .then((res) => {
        console.log(
          "[Analytics Page] Response status:",
          res.status,
          res.statusText
        );
        if (!res.ok) {
          throw new Error(`API request failed: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("[Analytics Page] Received data:", data);
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        console.error("[Analytics Page] Error:", err);
        setError(err.message || "Unknown error");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (error) {
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
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-semibold">
            Error Loading Analytics
          </h3>
          <p className="text-red-600">{error}</p>
        </div>
      </>
    );
  }

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
        {loading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-blue-600">Loading analytics data...</p>
          </div>
        )}

        {/* Stats cards */}
        <Card>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>Visitors: {stats?.visitors || "Loading..."}</div>
              <div>Views: {stats?.views || "Loading..."}</div>
              <div>
                Bounce Rate:{" "}
                {stats?.bounceRate ? `${stats.bounceRate}%` : "Loading..."}
              </div>
            </div>
          </div>
        </Card>

        {/* Chart */}
        {!loading && (
          <TimeSeriesChart
            // @ts-expect-error - TODO: fix this
            siteId="mulls-io"
            interval="7d"
            filters={{}}
            timezone="UTC"
          />
        )}

        {/* Data tables */}
        {!loading && (
          <>
            <TableCard
              // @ts-expect-error - TODO: fix this
              endpoint="paths"
              title="Top Pages"
              siteId="mulls-io"
              interval="7d"
              filters={{}}
              onFilterChange={() => {}}
              timezone="UTC"
            />
            <TableCard
              // @ts-expect-error - TODO: fix this
              endpoint="referrers"
              title="Top Referrers"
              siteId="mulls-io"
              interval="7d"
              filters={{}}
              onFilterChange={() => {}}
              timezone="UTC"
            />
          </>
        )}
      </div>
    </>
  );
}
