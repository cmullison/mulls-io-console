/* eslint-disable @typescript-eslint/no-unused-vars */
// src/components/AnalyticsDashboard.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // Adjust path as needed
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; // Adjust path as needed
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { Loader2 } from "lucide-react";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { ChartPieLegend } from "@/components/chart-pie-legend";
import { ChartPieLabelList } from "@/components/chart-pie-label-list";

// --- Interfaces for fetched data ---

// Generic WAE API Response wrapper
interface WAEApiResponse<T> {
  data: T[];
  meta?: any; // Include meta if you need it
  rows?: number;
  rows_before_limit_at_least?: number;
  error?: string; // Add error field for fetch errors
  details?: string;
}

// Specific data types matching API route outputs
interface CountData {
  count: number;
}
interface SessionCountData {
  uniqueSessions: number;
}
interface DateCountData {
  date: string;
  count: number;
}
interface GroupCountData {
  group: string;
  count: number;
}
interface PageViewData {
  pageTitle: string;
  count: number;
}
interface ReferrerData {
  referrer: string;
  count: number;
}
interface BounceRateData {
  bounceRate: number;
}
interface SessionDurationData {
  avgDurationSeconds: number;
}

// --- Helper Functions ---

// Fetch data from our API endpoint
async function fetchAnalyticsData<T>(
  metric: string,
  params?: Record<string, string>
): Promise<WAEApiResponse<T>> {
  const url = new URL("/api/analytics/query", window.location.origin);
  url.searchParams.set("metric", metric);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    if (!response.ok) {
      console.error(`Error fetching ${metric}:`, data);
      return {
        data: [],
        // @ts-expect-error - TODO: fix this
        error: data.error || `HTTP error ${response.status}`,
        // @ts-expect-error - TODO: fix this
        details: data.details,
      };
    }
    // Ensure data is always an array, even if WAE returns null/undefined
    // @ts-expect-error - TODO: fix this
    return { ...data, data: data.data || [] };
  } catch (error: any) {
    console.error(`Network error fetching ${metric}:`, error);
    return { data: [], error: "Network error", details: error.message };
  }
}

// Format large numbers (e.g., 1234 -> 1.2k)
const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
};

// Format duration in seconds to human readable format
const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds > 0
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes}m`;
};

// --- Loading Spinner ---
const LoadingSpinner = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center py-8 ${className}`}>
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

// --- Error Display ---
const ErrorDisplay = ({
  error,
  details,
}: {
  error?: string;
  details?: string;
}) => (
  <div className="text-destructive p-4 border border-destructive bg-destructive/10 rounded-md">
    <p className="font-semibold">Error loading data:</p>
    <p>{error || "An unknown error occurred."}</p>
    {details && (
      <pre className="mt-2 text-xs whitespace-pre-wrap">{details}</pre>
    )}
  </div>
);

// --- Main Dashboard Component ---

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("7"); // Default to 7 days
  const [selectedSiteId, setSelectedSiteId] = useState<string>("mulls.io"); // Default to mulls.io
  const [availableSiteIds, setAvailableSiteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for each data metric
  const [totalViews, setTotalViews] = useState<number | null>(null);
  const [uniqueSessions, setUniqueSessions] = useState<number | null>(null);
  const [bounceRate, setBounceRate] = useState<number | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number | null>(null);
  const [buttonClicks, setButtonClicks] = useState<number | null>(null);
  const [viewsOverTime, setViewsOverTime] = useState<DateCountData[]>([]);
  const [sessionsOverTime, setSessionsOverTime] = useState<DateCountData[]>([]);
  const [topPages, setTopPages] = useState<PageViewData[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<GroupCountData[]>([]);
  const [browsers, setBrowsers] = useState<GroupCountData[]>([]);
  const [referrers, setReferrers] = useState<ReferrerData[]>([]);
  const [topProjects, setTopProjects] = useState<GroupCountData[]>([]);
  const [topButtons, setTopButtons] = useState<GroupCountData[]>([]);
  const [domains, setDomains] = useState<GroupCountData[]>([]);
  const [subdomains, setSubdomains] = useState<GroupCountData[]>([]);

  // Contact and Experience Interaction States
  const [contactInteractions, setContactInteractions] = useState<number | null>(
    null
  );
  const [topContactActions, setTopContactActions] = useState<GroupCountData[]>(
    []
  );
  const [experienceInteractions, setExperienceInteractions] = useState<
    number | null
  >(null);
  const [topExperienceActions, setTopExperienceActions] = useState<
    GroupCountData[]
  >([]);

  // Load available siteIds on mount
  useEffect(() => {
    const loadSiteIds = async () => {
      try {
        // Fetch real siteId data from API
        const response = await fetchAnalyticsData<{ siteId: string }>(
          "available_sites"
        );
        if (response.data) {
          setAvailableSiteIds(response.data.map((item) => item.siteId));
        }
      } catch (error) {
        console.error("Failed to load available siteIds:", error);
      }
    };
    loadSiteIds();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      const params: Record<string, string> = { days: timeRange };

      // Add siteId filter (always use selectedSiteId since we default to mulls.io)
      params.siteId = selectedSiteId;

      try {
        const results = await Promise.allSettled([
          fetchAnalyticsData<CountData>("total_views", params),
          fetchAnalyticsData<SessionCountData>("unique_sessions", params),
          fetchAnalyticsData<BounceRateData>("bounce_rate", params),
          fetchAnalyticsData<SessionDurationData>("session_duration", params),
          fetchAnalyticsData<CountData>("button_clicks", params),
          fetchAnalyticsData<DateCountData>("views_over_time", params),
          fetchAnalyticsData<DateCountData>("sessions_over_time", params),
          fetchAnalyticsData<PageViewData>("top_pages", {
            ...params,
            limit: "10",
          }),
          fetchAnalyticsData<GroupCountData>("device_types", {
            ...params,
            limit: "5",
          }),
          fetchAnalyticsData<GroupCountData>("browsers", {
            ...params,
            limit: "7",
          }),
          fetchAnalyticsData<ReferrerData>("referrers", {
            ...params,
            limit: "10",
          }),
          fetchAnalyticsData<GroupCountData>("top_projects_viewed", {
            ...params,
            limit: "5",
          }),
          fetchAnalyticsData<GroupCountData>("top_buttons_clicked", {
            ...params,
            limit: "8",
          }),
          fetchAnalyticsData<GroupCountData>("domains", {
            ...params,
            limit: "5",
          }),
          fetchAnalyticsData<GroupCountData>("subdomains", {
            ...params,
            limit: "5",
          }),
          // Contact and Experience Interactions
          fetchAnalyticsData<CountData>("contact_interactions", params),
          fetchAnalyticsData<GroupCountData>("top_contact_actions", {
            ...params,
            limit: "5",
          }),
          fetchAnalyticsData<CountData>("experience_interactions", params),
          fetchAnalyticsData<GroupCountData>("top_experience_actions", {
            ...params,
            limit: "5",
          }),
        ]);

        // Process results and check for errors
        let fetchError: React.SetStateAction<string | null> = null;
        results.forEach((result, index) => {
          if (result.status === "rejected") {
            console.error(`Fetch failed for index ${index}:`, result.reason);
            fetchError =
              fetchError ||
              `Failed to load some data. See console for details.`;
          } else if (result.value.error) {
            console.error(
              `API Error for index ${index}: ${result.value.error}`,
              result.value.details
            );
            fetchError =
              fetchError || `${result.value.error}. Check console/API logs.`;
            // Optionally display result.value.details if needed
          }
        });
        setError(fetchError); // Set combined error message if any fetch failed

        // Update state even if some fetches failed, using default/empty values
        const [
          viewsRes,
          sessionsRes,
          bounceRes,
          durationRes,
          clicksRes,
          timeRes,
          sessionsTimeRes,
          pagesRes,
          devicesRes,
          browsersRes,
          referrersRes,
          projectsRes,
          buttonsRes,
          domainsRes,
          subdomainsRes,
          contactInteractionsRes,
          topContactActionsRes,
          experienceInteractionsRes,
          topExperienceActionsRes,
        ] = results.map((r) =>
          r.status === "fulfilled" ? r.value : { data: [] }
        ) as WAEApiResponse<any>[];

        setTotalViews(viewsRes.data?.[0]?.count ?? 0);
        setUniqueSessions(sessionsRes.data?.[0]?.uniqueSessions ?? 0);
        setBounceRate(bounceRes.data?.[0]?.bounceRate ?? 0);
        setSessionDuration(durationRes.data?.[0]?.avgDurationSeconds ?? 0);
        setButtonClicks(clicksRes.data?.[0]?.count ?? 0);
        setViewsOverTime(timeRes.data ?? []);
        setSessionsOverTime(sessionsTimeRes.data ?? []);
        setTopPages(pagesRes.data ?? []);
        setDeviceTypes(devicesRes.data ?? []);
        setBrowsers(browsersRes.data ?? []);
        setReferrers(referrersRes.data ?? []);
        setTopProjects(projectsRes.data ?? []);
        setTopButtons(buttonsRes.data ?? []);
        setDomains(domainsRes.data ?? []);
        setSubdomains(subdomainsRes.data ?? []);

        // Set contact and experience interaction data
        setContactInteractions(contactInteractionsRes.data?.[0]?.count ?? 0);
        setTopContactActions(topContactActionsRes.data ?? []);
        setExperienceInteractions(
          experienceInteractionsRes.data?.[0]?.count ?? 0
        );
        setTopExperienceActions(topExperienceActionsRes.data ?? []);
      } catch (err: any) {
        console.error("Error loading dashboard data:", err);
        setError(
          err.message || "An unexpected error occurred during data fetching."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [timeRange, selectedSiteId]); // Re-fetch when timeRange or selectedSiteId changes

  // --- Render Functions for Charts/Tables ---

  const renderLoadingOrError = (dataError?: string | null) => {
    if (loading) return <LoadingSpinner />;
    const displayError = dataError || error; // Prioritize specific data error, fallback to general error
    if (displayError) return <ErrorDisplay error={displayError} />;
    return null;
  };

  const renderKPICard = (
    title: string,
    value: number | null,
    description: string
  ) => (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-4xl">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : value !== null ? (
            title === "Bounce Rate" ? (
              `${value}%`
            ) : title === "Avg. Session Duration" ? (
              formatDuration(value)
            ) : (
              formatNumber(value)
            )
          ) : (
            <ErrorDisplay error="Failed" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground">{description}</div>
      </CardContent>
    </Card>
  );

  const renderViewsAndSessionsChart = () => {
    const loadingOrError = renderLoadingOrError();
    if (loadingOrError) return loadingOrError;
    if (viewsOverTime.length === 0 && sessionsOverTime.length === 0 && !loading)
      return (
        <p className="text-muted-foreground p-4 text-center">
          No data for this period.
        </p>
      );

    // Merge views and sessions data by date for the interactive chart
    const chartData = viewsOverTime.map((view) => {
      const sessionData = sessionsOverTime.find(
        (session) => session.date === view.date
      );
      return {
        date: view.date,
        desktop: view.count, // Page views
        mobile: sessionData?.count || 0, // Unique sessions
      };
    });

    return <ChartAreaInteractive data={chartData} />;
  };

  const renderDeviceTypesChart = () => {
    const loadingOrError = renderLoadingOrError();
    if (loadingOrError) return loadingOrError;
    if (deviceTypes.length === 0 && !loading)
      return (
        <p className="text-muted-foreground p-4 text-center">
          No device types data.
        </p>
      );

    // Transform data for ChartPieLegend component
    const chartData = deviceTypes.map((item, index) => {
      const deviceKey = item.group.toLowerCase().replace(/\s+/g, "-");
      return {
        device: deviceKey,
        visitors: item.count,
        fill: `var(--chart-${(index % 5) + 1})`,
      };
    });

    const chartConfig = deviceTypes.reduce(
      (config, item, index) => {
        const key = item.group.toLowerCase().replace(/\s+/g, "-");
        config[key] = {
          label: item.group,
          color: `var(--chart-${(index % 5) + 1})`,
        };
        return config;
      },
      { visitors: { label: "Visitors" } } as any
    );

    return (
      <ChartPieLegend
        data={chartData}
        config={chartConfig}
        title="Device Types"
      />
    );
  };

  const renderBrowsersChart = () => {
    const loadingOrError = renderLoadingOrError();
    if (loadingOrError) return loadingOrError;
    if (browsers.length === 0 && !loading)
      return (
        <p className="text-muted-foreground p-4 text-center">
          No browsers data.
        </p>
      );

    // Transform data for ChartPieLabelList component
    // Parse browser names from user agent strings
    const parseBrowserName = (userAgent: string) => {
      if (userAgent.includes("Chrome")) return "Chrome";
      if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
        return "Safari";
      if (userAgent.includes("Firefox")) return "Firefox";
      if (userAgent.includes("Edge")) return "Edge";
      if (userAgent.includes("Opera")) return "Opera";
      return "Other";
    };

    const chartData = browsers.map((item, index) => {
      const browserName = parseBrowserName(item.group);
      const browserKey = browserName.toLowerCase();
      return {
        browser: browserKey,
        visitors: item.count,
        fill: `var(--chart-${(index % 5) + 1})`,
      };
    });

    const chartConfig = browsers.reduce(
      (config, item, index) => {
        const browserName = parseBrowserName(item.group);
        const key = browserName.toLowerCase();
        config[key] = {
          label: browserName,
          color: `var(--chart-${(index % 5) + 1})`,
        };
        return config;
      },
      { visitors: { label: "Visitors" } } as any
    );

    return (
      <ChartPieLabelList
        data={chartData}
        config={chartConfig}
        title="Browsers"
      />
    );
  };

  const renderTopListTable = (
    data: Array<{ name: string; count: number }>,
    title: string,
    colName: string
  ) => {
    const loadingOrError = renderLoadingOrError();
    if (loadingOrError) return loadingOrError;
    if (data.length === 0 && !loading)
      return (
        <p className="text-muted-foreground p-4 text-center">
          No {title.toLowerCase()} data.
        </p>
      );

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{colName}</TableHead>
            <TableHead className="text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={`${item.name}-${index}`}>
              <TableCell
                className="font-medium truncate max-w-[200px] sm:max-w-[300px]"
                title={item.name}
              >
                {item.name}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(item.count)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select site" />
            </SelectTrigger>
            <SelectContent>
              {availableSiteIds
                .filter((siteId) => siteId && siteId.trim().length > 0)
                .map((siteId) => (
                  <SelectItem key={siteId} value={siteId}>
                    {siteId}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global Loading/Error State */}
      {loading && <LoadingSpinner className="my-10" />}
      {error && !loading && <ErrorDisplay error={error} />}

      {!loading && !error && (
        <>
          {/* Row 1: Core KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {renderKPICard(
              "Total Page Views",
              totalViews,
              `Page loads in the last ${timeRange} days`
            )}
            {renderKPICard(
              "Unique Sessions",
              uniqueSessions,
              `Distinct user sessions started`
            )}
            {renderKPICard(
              "Button Clicks",
              buttonClicks,
              `Total button/element interactions`
            )}
            {renderKPICard(
              "Bounce Rate",
              bounceRate,
              `Percentage of single-page sessions`
            )}
            {renderKPICard(
              "Avg. Session Duration",
              sessionDuration,
              `Average time between first and last page view`
            )}
          </div>

          {/* Row 1.5: Interaction KPIs */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {renderKPICard(
              "Contact Interactions",
              contactInteractions,
              `Form submissions, social clicks, and contact actions`
            )}
            {renderKPICard(
              "Experience Interactions",
              experienceInteractions,
              `Skills clicks, experience expansions, and portfolio views`
            )}
          </div>

          {/* Row 2: Views and Sessions Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Page Views & Unique Sessions Over Time</CardTitle>
              <CardDescription>
                Daily trends of page views and unique user sessions.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderViewsAndSessionsChart()}</CardContent>
          </Card>

          {/* Row 3: Devices and Browsers */}
          <div className="grid gap-4 md:grid-cols-2">
            {renderDeviceTypesChart()}
            {renderBrowsersChart()}
          </div>

          {/* Row 4: Top Pages and Top Referrers */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most viewed pages.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderTopListTable(
                  topPages.map((p) => ({ name: p.pageTitle, count: p.count })),
                  "Top Pages",
                  "Page Title"
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Where users are coming from.</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Simple domain extraction for cleaner display */}
                {renderTopListTable(
                  referrers.map((r) => {
                    let name = r.referrer;
                    try {
                      // Attempt to parse URL and get hostname for cleaner display
                      if (name.startsWith("http")) {
                        const url = new URL(name);
                        name = url.hostname.replace(/^www\./, ""); // Remove www.
                      } else if (name === "") {
                        name = "(Direct)"; // Or '(Unknown)'
                      }
                    } catch {
                      /* Ignore parsing errors, use original */
                    }
                    return { name: name || "(Direct)", count: r.count };
                  }),
                  "Referrers",
                  "Source"
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 5: Interactions */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Projects Viewed</CardTitle>
                <CardDescription>
                  Most frequently viewed project pages/sections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTopListTable(
                  topProjects.map((p) => ({ name: p.group, count: p.count })),
                  "Top Projects",
                  "Project Title"
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Most Clicked Elements</CardTitle>
                <CardDescription>
                  Buttons and interactive elements users click most.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTopListTable(
                  topButtons.map((b) => ({ name: b.group, count: b.count })),
                  "Top Buttons",
                  "Button/Element"
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 6: Domains and Subdomains */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Domains</CardTitle>
                <CardDescription>Most visited domains.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderTopListTable(
                  domains.map((d) => ({ name: d.group, count: d.count })),
                  "Top Domains",
                  "Domain"
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Subdomains</CardTitle>
                <CardDescription>Most visited subdomains.</CardDescription>
              </CardHeader>
              <CardContent>
                {renderTopListTable(
                  subdomains.map((s) => ({
                    name: s.group || "(none)",
                    count: s.count,
                  })),
                  "Top Subdomains",
                  "Subdomain"
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 7: Contact and Experience Interaction Breakdowns */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Contact Actions</CardTitle>
                <CardDescription>
                  Most common contact interaction types.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTopListTable(
                  topContactActions.map((action) => ({
                    name: action.group || "Unknown",
                    count: action.count,
                  })),
                  "Contact Actions",
                  "Action Type"
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Experience Actions</CardTitle>
                <CardDescription>
                  Most common experience interaction types.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderTopListTable(
                  topExperienceActions.map((action) => ({
                    name: action.group || "Unknown",
                    count: action.count,
                  })),
                  "Experience Actions",
                  "Action Type"
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
