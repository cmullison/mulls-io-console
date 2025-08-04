import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    // Map to existing Counterscale endpoints
    const endpointMap: Record<string, string> = {
      'stats': 'resources/stats',
      'timeseries': 'resources/timeseries',
      'paths': 'resources/paths',
      'referrers': 'resources/referrer',
      'countries': 'resources/country',
      'browsers': 'resources/browser',
      'devices': 'resources/device'
    };

    const route = (endpoint && endpointMap[endpoint]) || 'resources/stats';
    const url = new URL(`https://counterscale.hall-russets0w.workers.dev/${route}`);

    // Copy all search params except endpoint
    searchParams.forEach((value, key) => {
      if (key !== 'endpoint' && value) {
        url.searchParams.set(key, value);
      }
    });

    try {
      const response = await fetch(url.toString());
      const data = await response.json();
      return NextResponse.json(data);
    } catch {
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }
}