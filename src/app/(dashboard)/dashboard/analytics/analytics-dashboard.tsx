"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import TimeSeriesChart from "./components/TimeSeriesChart";
import TableCard from "./components/TableCard";
import SearchFilterBadges from "./components/SearchFilterBadges";

// Types
interface SearchFilters {
  path?: string;
  referrer?: string;
  deviceModel?: string;
  deviceType?: string;
  country?: string;
  browserName?: string;
  browserVersion?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DashboardData {
  siteId: string;
  sites: string[];
  interval: string;
  filters: SearchFilters;
}

interface StatsData {
  views: number;
  visitors: number;
  bounceRate?: number;
  hasSufficientBounceData: boolean;
}

// Utility function to get user timezone
function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

// API helper function - now uses local API route
async function fetchAnalytics(
  endpoint: string,
  params: Record<string, string> = {}
) {
  const url = new URL("/api/analytics", window.location.origin);
  url.searchParams.set("endpoint", endpoint);

  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  console.log("[Analytics API] Fetching:", url.toString());

  const response = await fetch(url.toString());

  console.log(
    "[Analytics API] Response status:",
    response.status,
    response.statusText
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Analytics API] Error response:", errorText);
    throw new Error(
      `API request failed: ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  console.log("[Analytics API] Response data:", data);
  return data;
}

export default function AnalyticsDashboard({
  initialSiteId = "",
  initialInterval = "7d",
}: {
  initialSiteId?: string;
  initialInterval?: string;
}) {
  console.log("[Analytics Dashboard] Initialized with:", {
    initialSiteId,
    initialInterval,
  });

  // State
  const [siteId, setSiteId] = useState(initialSiteId);
  const [interval, setInterval] = useState(initialInterval);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [sites, setSites] = useState<string[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userTimezone = getUserTimezone();

  // Load available sites on mount
  useEffect(() => {
    const loadSites = async () => {
      try {
        console.log(
          "[Analytics] Loading sites with initialSiteId:",
          initialSiteId
        );

        // In a real implementation, you'd have an endpoint to get sites
        // For now, we'll assume you know your site IDs
        const sitesArray = [initialSiteId].filter(Boolean);
        console.log("[Analytics] Setting sites:", sitesArray);
        setSites(sitesArray);

        if (!siteId && initialSiteId) {
          console.log("[Analytics] Setting initial siteId:", initialSiteId);
          setSiteId(initialSiteId);
        }
      } catch (err) {
        console.error("[Analytics] Error loading sites:", err);
        setError("Failed to load sites");
      }
    };

    loadSites();
  }, [initialSiteId, siteId]);

  // Load stats when siteId or interval changes
  useEffect(() => {
    if (!siteId) {
      console.log("[Analytics] No siteId, skipping stats load");
      return;
    }

    const loadStats = async () => {
      try {
        console.log("[Analytics] Loading stats for:", {
          siteId,
          interval,
          filters,
          timezone: userTimezone,
        });
        setLoading(true);

        const statsData = await fetchAnalytics("stats", {
          siteId,
          interval,
          timezone: userTimezone,
          ...filters,
        });

        console.log("[Analytics] Received stats data:", statsData);
        // @ts-expect-error - TODO: fix this
        setStats(statsData);
        setError(null);
      } catch (err) {
        console.error("[Analytics] Error loading stats:", err);
        setError(
          `Failed to load analytics data: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [siteId, interval, filters, userTimezone]);

  // Event handlers
  const changeSite = useCallback((newSite: string) => {
    setSiteId(newSite);
    setFilters({}); // Clear filters when changing sites
  }, []);

  const changeInterval = useCallback((newInterval: string) => {
    setInterval(newInterval);
  }, []);

  const handleFilterChange = useCallback((newFilters: SearchFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleFilterDelete = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key as keyof SearchFilters];
      return newFilters;
    });
  }, []);

  // Format numbers
  const countFormatter = new Intl.NumberFormat("en", { notation: "compact" });

  if (error) {
    return (
      <div className="border-2 rounded p-4 bg-card">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="bg-transparent"
      style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.8" }}
    >
      {/* Controls */}
      <div className="w-full mb-4 flex gap-4 flex-wrap">
        <div className="lg:basis-1/5-gap-4 sm:basis-1/4-gap-4 basis-1/2-gap-4">
          <Select value={siteId || "@unknown"} onValueChange={changeSite}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sites?.map((site: string) => (
                <SelectItem key={`k-${site}`} value={site || "@unknown"}>
                  {site || "(unknown)"}
                </SelectItem>
              )) || []}
            </SelectContent>
          </Select>
        </div>

        <div className="lg:basis-1/6-gap-4 sm:basis-1/5-gap-4 basis-1/3-gap-4">
          <Select value={interval} onValueChange={changeInterval}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="1d">24 hours</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="basis-auto flex">
          <div className="m-auto">
            <SearchFilterBadges
              filters={filters}
              onFilterDelete={handleFilterDelete}
            />
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="transition" style={{ opacity: loading ? 0.6 : 1 }}>
        {/* Stats Cards */}
        <div className="w-full mb-4">
          <Card>
            <div className="p-4 pl-6">
              <div className="grid grid-cols-3 gap-10 items-end">
                <div>
                  <div className="text-md sm:text-lg">Visitors</div>
                  <div className="text-4xl">
                    {stats?.visitors
                      ? countFormatter.format(stats.visitors)
                      : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-md sm:text-lg">Views</div>
                  <div className="text-4xl">
                    {stats?.views ? countFormatter.format(stats.views) : "-"}
                  </div>
                </div>
                <div>
                  <div className="text-md sm:text-lg">
                    <span>
                      Bounce
                      <span className="hidden sm:inline"> Rate</span>
                    </span>
                  </div>
                  <div className="text-4xl">
                    {stats?.hasSufficientBounceData
                      ? stats?.bounceRate !== undefined
                        ? `${Math.round(stats.bounceRate * 100)}%`
                        : "-"
                      : "n/a"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Time Series Chart */}
        <div className="w-full mb-4">
          <TimeSeriesChart
            // @ts-expect-error - TODO: fix this
            siteId={siteId}
            interval={interval}
            filters={filters}
            timezone={userTimezone}
          />
        </div>

        {/* Top Level Tables */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <TableCard
            // @ts-expect-error - TODO: fix this
            title="Top Pages"
            endpoint="paths"
            siteId={siteId}
            interval={interval}
            filters={filters}
            onFilterChange={handleFilterChange}
            timezone={userTimezone}
          />
          <TableCard
            // @ts-expect-error - TODO: fix this
            title="Top Referrers"
            endpoint="referrers"
            siteId={siteId}
            interval={interval}
            filters={filters}
            onFilterChange={handleFilterChange}
            timezone={userTimezone}
          />
        </div>

        {/* Detail Tables */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <TableCard
            // @ts-expect-error - TODO: fix this
            title={filters.browserName ? "Browser Versions" : "Browsers"}
            endpoint={filters.browserName ? "browserversions" : "browsers"}
            siteId={siteId}
            interval={interval}
            filters={filters}
            onFilterChange={handleFilterChange}
            timezone={userTimezone}
          />
          <TableCard
            // @ts-expect-error - TODO: fix this
            title="Countries"
            endpoint="countries"
            siteId={siteId}
            interval={interval}
            filters={filters}
            onFilterChange={handleFilterChange}
            timezone={userTimezone}
          />
          <TableCard
            // @ts-expect-error - TODO: fix this
            title="Devices"
            endpoint="devices"
            siteId={siteId}
            interval={interval}
            filters={filters}
            onFilterChange={handleFilterChange}
            timezone={userTimezone}
          />
        </div>

        {/* Events Table (if you want to show events) */}
        <div className="w-full mb-4">
          <TableCard
            // @ts-expect-error - TODO: fix this
            title="Events"
            endpoint="events"
            siteId={siteId}
            interval={interval}
            filters={filters}
            onFilterChange={handleFilterChange}
            timezone={userTimezone}
          />
        </div>
      </div>
    </div>
  );
}
