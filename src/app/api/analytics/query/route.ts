/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/analytics/query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsEngineDataset } from '@cloudflare/workers-types';
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = 'force-dynamic'; // Ensure fresh data on each request

// Define the interface for Cloudflare environment with our bindings
interface CloudflareEnv {
  mulls_io_analytics: AnalyticsEngineDataset;
  // Add other bindings here if needed
}

// Define expected query result structure from WAE SQL API
interface WAEQueryResponse<T = Record<string, any>> {
  meta: {
    query_time_ms: number;
    [key: string]: any; // Other meta fields might exist
  };
  data: T[];
  rows: number;
  rows_before_limit_at_least: number;
}

// Define specific result types for our queries
interface CountResult {
  count: number;
}

interface DateCountResult {
  date: string;
  count: number;
}

interface GroupCountResult {
  group: string;
  count: number;
}

interface SessionCountResult {
  uniqueSessions: number;
}

interface PageViewResult {
  pageTitle: string;
  count: number;
}

interface ReferrerResult {
  referrer: string;
  count: number;
}

interface BounceRateResult {
  bounceRate: number;
}

interface SessionDurationResult {
  avgDurationSeconds: number;
}

// Helper to safely get the binding
function getAnalyticsBinding(): AnalyticsEngineDataset | null {
  try {
    // NOTE: Adjust this based on your exact @opennextjs/cloudflare setup
    // It might require specific context or initialization if not automatically available
    const context = getCloudflareContext();
    if (!context || !context.env) {
        console.error("Cloudflare context or env not found.");
        return null;
    }
    const typedEnv = context.env as unknown as CloudflareEnv;
    if (!typedEnv.mulls_io_analytics) {
        console.error("Analytics binding 'mulls_io_analytics' not found in env.");
        return null;
    }
    return typedEnv.mulls_io_analytics;
  } catch (error) {
    console.error("Error getting Cloudflare context/binding:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {

  const analytics = getAnalyticsBinding();
  if (!analytics) {
    return NextResponse.json({ error: 'Analytics binding not available' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const metric = searchParams.get('metric');
  const days = searchParams.get('days') || '7'; // Default to 7 days
  const limit = searchParams.get('limit') || '10';
  const siteIdFilter = searchParams.get('siteId'); // Optional siteId filter

  // Basic validation
  if (!metric) {
    return NextResponse.json({ error: 'Missing metric parameter' }, { status: 400 });
  }
  if (isNaN(parseInt(days)) || isNaN(parseInt(limit))) {
      return NextResponse.json({ error: 'Invalid days or limit parameter' }, { status: 400 });
  }

  // Helper function to extract siteId from URL or default to 'mulls.io'
  const extractSiteId = (url: string): string => {
    if (!url) return 'mulls.io';
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Extract domain name as siteId (remove subdomains)
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        return parts.slice(-2).join('.'); // e.g., "mulls.io", "example.com"
      }
      return hostname || 'mulls.io';
    } catch {
      return 'mulls.io'; // Default fallback
    }
  };

  let query = '';

  try {
    switch (metric) {
      case 'total_views':
        // Counts page_view events - fetch raw data for siteId filtering
        query = `
          SELECT blob4 as url, double2 as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'page_view'
        `;
        break;

      case 'unique_sessions':
        // Fetch raw session data for client-side deduplication
        query = `
          SELECT blob16 as sessionId, blob4 as url
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob16 != ''
        `;
        break;

      case 'views_over_time':
        // Counts page views grouped by date (index1)
        query = `
          SELECT index1 as date, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'page_view'
          GROUP BY date
          ORDER BY date ASC
        `;
        break;

      case 'sessions_over_time':
        // Get unique sessions grouped by date
        query = `
          SELECT index1 as date, blob16 as sessionId
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'page_view'
            AND blob16 != ''
          ORDER BY date ASC
        `;
        break;

      case 'top_pages':
        // Groups by page title (blob9), filters out empty titles
        query = `
          SELECT blob9 as pageTitle, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'page_view'
            AND blob9 != ''
          GROUP BY pageTitle
          ORDER BY count DESC
          LIMIT ${limit}
        `;
        break;

      case 'device_types':
        // Groups by device type (blob6), filters out empty values
         query = `
          SELECT blob6 as group, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob6 != ''
          GROUP BY group
          ORDER BY count DESC
          LIMIT ${limit}
        `;
        break;

      case 'browsers':
        // Simple browser grouping without complex parsing
        query = `
          SELECT blob7 as group, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob7 != ''
          GROUP BY group
          ORDER BY count DESC
          LIMIT ${limit}
        `;
        break;

       case 'referrers':
        // Simple referrer grouping
        query = `
          SELECT blob8 as referrer, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob8 != ''
          GROUP BY referrer
          ORDER BY count DESC
          LIMIT ${limit}
        `;
        break;

      // Add cases for project interactions, testimonials, contact submissions etc. if needed
      // Example: Project Views
      case 'top_projects_viewed':
         query = `
          SELECT blob3 as group, sum(double2) as count -- blob3 is projectTitle for project_interaction
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'project_interaction'
            AND blob2 = 'view' -- blob2 is action
            AND blob3 != ''
          GROUP BY group
          ORDER BY count DESC
          LIMIT ${limit}
        `;
        break;

      case 'button_clicks':
        // Get all button clicks (any interaction with action = 'click')
        query = `
          SELECT sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob2 = 'click' -- blob2 is action
        `;
        break;

      case 'top_buttons_clicked':
        // Get most clicked buttons/elements - simplified without CASE/CONCAT
        query = `
          SELECT
            blob1 as group,
            sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob2 = 'click'
            AND blob1 != ''
          GROUP BY blob1
          ORDER BY count DESC
          LIMIT ${limit}
        `;
        break;

      case 'clicks_over_time':
        // Button clicks grouped by date
        query = `
          SELECT index1 as date, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob2 = 'click'
          GROUP BY date
          ORDER BY date ASC
        `;
        break;

      case 'contact_interactions':
        // Total contact form interactions
        query = `
          SELECT sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'contact_interaction'
        `;
        break;

      case 'top_contact_actions':
        // Most common contact interaction types
        query = `
          SELECT blob2 as group, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'contact_interaction'
            AND blob2 != ''
          GROUP BY group
          ORDER BY count DESC
          LIMIT ${limit}
        `;
        break;

      case 'experience_interactions':
        // Total experience click interactions
        query = `
          SELECT sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'experience_click'
        `;
        break;

      case 'top_experience_actions':
        // Most common experience interaction types
        query = `
          SELECT blob2 as group, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'experience_click'
            AND blob2 != ''
          GROUP BY group
          ORDER BY count DESC
          LIMIT ${limit}
        `;
        break;

      case 'bounce_rate':
        // Fetch raw session data for client-side bounce rate calculation
        query = `
          SELECT
            blob16 as sessionId,
            sum(double2) as page_views
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'page_view'
            AND blob16 != ''
          GROUP BY sessionId
        `;
        break;

      case 'session_duration':
        // Fetch raw session timestamps for client-side duration calculation
        query = `
          SELECT
            blob16 as sessionId,
            MIN(timestamp) as first_view,
            MAX(timestamp) as last_view,
            sum(double2) as page_views
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'page_view'
            AND blob16 != ''
          GROUP BY sessionId
        `;
        break;

      case 'raw_sessions':
        // Fetch raw session data for client-side bounce rate and duration calculation
        query = `
          SELECT
            blob16 as sessionId,
            timestamp,
            blob9 as pageTitle
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob1 = 'page_view'
            AND blob16 != ''
          ORDER BY blob16, timestamp ASC
        `;
        break;

      case 'domains':
        // Get URLs for client-side domain extraction
        query = `
          SELECT blob4 as url, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob4 != ''
          GROUP BY url
          ORDER BY count DESC
        `;
        break;

      case 'subdomains':
        // Get URLs for client-side subdomain extraction
        query = `
          SELECT blob4 as url, sum(double2) as count
          FROM mulls_io_analytics
          WHERE timestamp >= NOW() - INTERVAL '${days}' DAY
            AND blob4 != ''
          GROUP BY url
          ORDER BY count DESC
        `;
        break;

      case 'available_sites':
        // Get all URLs (will dedupe in client processing to extract siteIds)
        query = `
          SELECT blob4 as url
          FROM mulls_io_analytics
          WHERE blob4 != ''
          LIMIT 1000
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid metric' }, { status: 400 });
    }

    console.log(`Executing WAE Query (${metric}): ${query}`);

    // Execute the query using the Analytics Engine SQL API
    const cfAnalyticsApiUrl = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/analytics_engine/sql`;

    const response = await fetch(cfAnalyticsApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
      body: query,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error: ${response.status} ${errorText}`);
    }

    const results = await response.json();
    console.log(`WAE Query Results (${metric}):`, results);

    // Process results for client-side calculations
    let processedResults = results;

    if (results && typeof results === 'object' && 'data' in results) {
      if (metric === 'total_views' && results.data && Array.isArray(results.data)) {
        // Filter and aggregate total views by siteId
        let filteredData = results.data;

        if (siteIdFilter) {
          filteredData = results.data.filter((row: any) => {
            const siteId = extractSiteId(row.url);
            return siteId === siteIdFilter;
          });
        } else {
          // Default to mulls.io if no filter specified
          filteredData = results.data.filter((row: any) => {
            const siteId = extractSiteId(row.url);
            return siteId === 'mulls.io';
          });
        }

        const totalCount = filteredData.reduce((sum: number, row: any) => sum + (row.count || 0), 0);

        processedResults = {
          data: [{ count: totalCount }],
          // @ts-expect-error - TODO: fix this
          meta: results.meta,
          rows: 1,
          rows_before_limit_at_least: 1
        };
      } else if (metric === 'unique_sessions' && results.data && Array.isArray(results.data)) {
        // Filter and count unique sessions by siteId
        let sessionsToCount = results.data;

        if (siteIdFilter) {
          sessionsToCount = results.data.filter((row: any) => {
            const siteId = extractSiteId(row.url);
            return siteId === siteIdFilter;
          });
        } else {
          // Default to mulls.io if no filter specified
          sessionsToCount = results.data.filter((row: any) => {
            const siteId = extractSiteId(row.url);
            return siteId === 'mulls.io';
          });
        }

        const uniqueSessionCount = new Set(sessionsToCount.map((row: any) => row.sessionId)).size;

        processedResults = {
          data: [{ uniqueSessions: uniqueSessionCount }],
          // @ts-expect-error - TODO: fix this
          meta: results.meta,
          rows: 1,
          rows_before_limit_at_least: 1
        };
      } else if (metric === 'bounce_rate') {
        // Calculate bounce rate from session data
        const sessionData = results.data;
        // @ts-expect-error - TODO: fix this
        const totalSessions = sessionData.length;
        // @ts-expect-error - TODO: fix this
        const bounceSessions = sessionData.filter((session: any) => session.page_views === 1).length;
        const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100 * 100) / 100 : 0;

        processedResults = {
          data: [{ bounceRate }],
          // @ts-expect-error - TODO: fix this
          meta: results.meta,
          rows: 1,
          rows_before_limit_at_least: 1
        };
      } else if (metric === 'session_duration') {
        // Calculate average session duration from timestamp data
        const sessionData = results.data;
        // @ts-expect-error - TODO: fix this
        const sessionsWithMultipleViews = sessionData.filter((session: any) => session.page_views > 1);

        if (sessionsWithMultipleViews.length === 0) {
          processedResults = {
            data: [{ avgDurationSeconds: 0 }],
            // @ts-expect-error - TODO: fix this
            meta: results.meta,
            rows: 1,
            rows_before_limit_at_least: 1
          };
        } else {
          const durations = sessionsWithMultipleViews.map((session: any) => {
            const firstView = new Date(session.first_view).getTime();
            const lastView = new Date(session.last_view).getTime();
            return (lastView - firstView) / 1000; // Convert to seconds
          }).filter((duration: number) => duration > 0 && duration < 3600); // Filter out unrealistic durations

          const avgDuration = durations.length > 0
            ? Math.round(durations.reduce((sum: number, d: number) => sum + d, 0) / durations.length)
            : 0;

          processedResults = {
            data: [{ avgDurationSeconds: avgDuration }],
            // @ts-expect-error - TODO: fix this
            meta: results.meta,
            rows: 1,
            rows_before_limit_at_least: 1
          };
        }
            } else if (metric === 'sessions_over_time') {
        // Process sessions over time - group by date and count unique sessions
        const sessionData = results.data;
        const sessionsByDate = new Map<string, Set<string>>();

        // @ts-expect-error - TODO: fix this
        sessionData.forEach((row: any) => {
          if (row.date && row.sessionId) {
            if (!sessionsByDate.has(row.date)) {
              sessionsByDate.set(row.date, new Set());
            }
            sessionsByDate.get(row.date)!.add(row.sessionId);
          }
        });

        const sessionsOverTimeData = Array.from(sessionsByDate.entries())
          .map(([date, sessions]) => ({
            date,
            count: sessions.size
          }))
          .sort((a, b) => a.date.localeCompare(b.date));

        processedResults = {
          data: sessionsOverTimeData,
          // @ts-expect-error - TODO: fix this
          meta: results.meta,
          rows: sessionsOverTimeData.length,
          rows_before_limit_at_least: sessionsOverTimeData.length
        };
      } else if (metric === 'available_sites') {
        // Parse URLs to extract unique siteId options
        const urlData = results.data;
        const siteIdOptions = new Set<string>();

        // Always include mulls.io as default
        siteIdOptions.add('mulls.io');

        // @ts-expect-error - TODO: fix this
        urlData.forEach((row: any) => {
          if (row.url) {
            const siteId = extractSiteId(row.url);
            siteIdOptions.add(siteId);
          }
        });

        processedResults = {
          data: Array.from(siteIdOptions).sort().map(siteId => ({ siteId })),
          // @ts-expect-error - TODO: fix this
          meta: results.meta,
          rows: siteIdOptions.size,
          rows_before_limit_at_least: siteIdOptions.size
        };
      } else if (metric === 'domains' && results.data && Array.isArray(results.data)) {
        // Parse URLs to extract domains and aggregate counts
        const domainCounts = new Map<string, number>();
        results.data.forEach((row: any) => {
          if (row.url) {
            try {
              const urlObj = new URL(row.url);
              const hostname = urlObj.hostname;
              const parts = hostname.split('.');
              const domain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;
              domainCounts.set(domain, (domainCounts.get(domain) || 0) + (row.count || 1));
            } catch {
              // Invalid URL, skip
            }
          }
        });

        const sortedDomains = Array.from(domainCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, parseInt(limit))
          .map(([domain, count]) => ({ group: domain, count }));

        processedResults = {
          data: sortedDomains,
          // @ts-expect-error - TODO: fix this
          meta: results.meta,
          rows: sortedDomains.length,
          rows_before_limit_at_least: sortedDomains.length
        };
      } else if (metric === 'subdomains' && results.data && Array.isArray(results.data)) {
        // Parse URLs to extract subdomains and aggregate counts
        const subdomainCounts = new Map<string, number>();
        results.data.forEach((row: any) => {
          if (row.url) {
            try {
              const urlObj = new URL(row.url);
              const hostname = urlObj.hostname;
              const parts = hostname.split('.');
              const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '(none)';
              subdomainCounts.set(subdomain, (subdomainCounts.get(subdomain) || 0) + (row.count || 1));
            } catch {
              // Invalid URL, skip
            }
          }
        });

        const sortedSubdomains = Array.from(subdomainCounts.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, parseInt(limit))
          .map(([subdomain, count]) => ({ group: subdomain, count }));

        processedResults = {
          data: sortedSubdomains,
          // @ts-expect-error - TODO: fix this
          meta: results.meta,
          rows: sortedSubdomains.length,
          rows_before_limit_at_least: sortedSubdomains.length
        };
      } else {
        processedResults = results;
      }

      return NextResponse.json(processedResults);
    } else {
        // Fallback or handle older structures if necessary
        console.warn("WAE query result structure might be unexpected:", results);
         return NextResponse.json({ data: results || [], meta: {}, rows: (results as any[])?.length ?? 0, rows_before_limit_at_least: (results as any[])?.length ?? 0 });
    }


  } catch (error: any) {
    console.error(`Error querying WAE for metric ${metric}:`, error);
    // Provide more context on the error if possible
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
        error: 'Failed to query analytics data',
        details: errorMessage,
        query: query, // Include query for debugging
        // stack: errorStack // Be cautious exposing stack traces
    }, { status: 500 });
  }
}