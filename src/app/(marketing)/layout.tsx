import NavFooterLayout from "@/layouts/NavFooterLayout";
import { MullsIOConsoleStickyBanner } from "@/components/mulls-io-console-sticky-banner";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavFooterLayout>
      {children}
      <MullsIOConsoleStickyBanner />
    </NavFooterLayout>
  );
}
