"use client";

import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

interface PageViewTrackerProps {
  children: React.ReactNode;
}

function getSessionId() {
  if (typeof window === "undefined") {
    return null; // Or handle the case when running on the server
  }

  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

export function PageViewTracker({ children }: PageViewTrackerProps) {
  useEffect(() => {
    const deviceType = /Mobi|Android/i.test(navigator.userAgent)
      ? "Mobile"
      : "Desktop";
    const browser = navigator.userAgent;
    const referrer = document.referrer;
    const pageTitle = document.title;
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const operatingSystem = navigator.platform;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const cookiesEnabled = navigator.cookieEnabled;
    const sessionId = getSessionId();

    const trackPageView = async () => {
      try {
        const response = await fetch("/api/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: "page_view",
            action: "view", // Add the action field
            siteId: "mulls-io-portfolio", // Add site identifier
            deviceType,
            browser,
            referrer,
            url: window.location.href,
            pageTitle,
            screenWidth,
            screenHeight,
            operatingSystem,
            language,
            timezone,
            cookiesEnabled,
            sessionId,
          }),
        });
        await response.json();
      } catch (error) {
        console.error("Failed to track page view:", error);
      }
    };

    trackPageView();
  }, []);

  return <>{children}</>;
}
