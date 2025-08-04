import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PageBanner({
  bannerDescription,
  bannerTitle,
}: {
  bannerDescription: string;
  bannerTitle: string;
}) {
  return (
    <Card className="overflow-hidden rounded-none border-t-0 border-l-0 border-r-0 border-b-1 m-0 p-0 !shadow-none">
      <CardHeader className="min-h-16 py-2 bg-gradient-to-br from-blue-100 via-pink-100 to-orange-100 dark:from-blue-900 dark:via-pink-900 dark:to-orange-900">
        <div
          className="p-2 w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          <CardTitle className="text-xl font-semibold">{bannerTitle}</CardTitle>
          <CardDescription className="">{bannerDescription}</CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
