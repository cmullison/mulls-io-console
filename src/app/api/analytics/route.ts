import { NextRequest, NextResponse } from 'next/server';
import type { AnalyticsEngineDataset } from '@cloudflare/workers-types';
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { v4 as uuidv4 } from 'uuid';

// Define the interface for Cloudflare environment with our bindings
interface CloudflareEnv {
  mulls_io_analytics: AnalyticsEngineDataset;
  // Add other bindings here if needed
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      // @ts-expect-error - TODO: fix this
      event,
      // Common interaction properties
      // @ts-expect-error - TODO: fix this
      action,
      // Project interactions
      // @ts-expect-error - TODO: fix this
      projectTitle,
      // @ts-expect-error - TODO: fix this
      url,
      // Testimonial interactions
      // @ts-expect-error - TODO: fix this
      testimonialId,
      // @ts-expect-error - TODO: fix this
      testimonialTitle,
      // Contact interactions
      // @ts-expect-error - TODO: fix this
      field,
      // @ts-expect-error - TODO: fix this
      status,
      // @ts-expect-error - TODO: fix this
      platform,
      // @ts-expect-error - TODO: fix this
      contactType,
      // General analytics
      // @ts-expect-error - TODO: fix this
      deviceType,
      // @ts-expect-error - TODO: fix this
      browser,
      // @ts-expect-error - TODO: fix this
      referrer,
      // @ts-expect-error - TODO: fix this
      pageTitle,
      // @ts-expect-error - TODO: fix this
      screenWidth,
      // @ts-expect-error - TODO: fix this
      screenHeight,
      // @ts-expect-error - TODO: fix this
      operatingSystem,
      // @ts-expect-error - TODO: fix this
      language,
      // @ts-expect-error - TODO: fix this
      timezone,
      // @ts-expect-error - TODO: fix this
      cookiesEnabled,
      // @ts-expect-error - TODO: fix this
      sessionId,
      // Site identification
      // @ts-expect-error - TODO: fix this
      siteId
    } = body;

    // Get the analytics binding directly from Cloudflare context
    const { env } = getCloudflareContext();
    // Cast the env to our custom environment interface
    const typedEnv = env as unknown as CloudflareEnv;
    const analytics = typedEnv.mulls_io_analytics;

    console.log("Analytics object:", analytics); // Check if analytics is defined

    if (analytics) {
      console.log("Event:", event, "Action:", action); // Log the event and button values

      // Ensure sessionId is always present
      const safeSessionId = sessionId || uuidv4(); // Generate new if not provided

      // Extract domain and subdomain from URL
      let domain = '';
      let subdomain = '';
      if (url) {
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          const parts = hostname.split('.');
          
          if (parts.length >= 2) {
            domain = parts.slice(-2).join('.'); // last 2 parts: example.com
            if (parts.length > 2) {
              subdomain = parts.slice(0, -2).join('.'); // everything before: www, blog, etc
            }
          }
        } catch {
          // Invalid URL, leave domain/subdomain empty
        }
      }

      analytics.writeDataPoint({
        blobs: [
          siteId || 'mulls-io-portfolio', // Site identifier (blob1)
          event, // Main event type (project_interaction, testimonial_interaction, etc.) (blob2)
          action || '', // Action type (view, click, etc.) (blob3)
          // Additional context based on event type
          projectTitle || testimonialTitle || field || '', // blob4
          url || platform || contactType || '', // blob5
          status || '', // For form submissions (blob6)
          deviceType || '', // blob7
          browser || '', // blob8
          referrer || '', // blob9
          pageTitle || '', // blob10
          screenWidth ? screenWidth.toString() : '', // blob11
          screenHeight ? screenHeight.toString() : '', // blob12
          operatingSystem || '', // blob13
          language || '', // blob14
          timezone || '', // blob15
          cookiesEnabled ? 'true' : 'false', // blob16
          safeSessionId, // Use the guaranteed session ID (blob17)
          domain || '', // Domain (blob18)
          subdomain || '' // Subdomain (blob19)
        ],
        doubles: [
          testimonialId || 0, // Numeric identifiers if available
          1 // Count
        ],
        indexes: [new Date().toISOString().split('T')[0]]
      });
      console.log("writeDataPoint called successfully"); // Log if writeDataPoint is called
    } else {
      console.log("Analytics object is not defined. Check your Cloudflare bindings configuration.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}