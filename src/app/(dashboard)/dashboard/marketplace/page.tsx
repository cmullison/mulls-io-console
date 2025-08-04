import { PageHeader } from "@/components/page-header";
import { Alert } from "@heroui/react";
import { COMPONENTS } from "./components-catalog";
import { MarketplaceCard } from "@/components/marketplace-card";
import { getSessionFromCookie } from "@/utils/auth";
import { getUserPurchasedItems } from "@/utils/credits";
import PageBanner from "@/components/page-banner";

export default async function MarketplacePage() {
  const session = await getSessionFromCookie();
  const purchasedItems = session
    ? await getUserPurchasedItems(session.userId)
    : new Set();

  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard/marketplace",
            label: "Marketplace",
          },
        ]}
      />
      <PageBanner
        bannerTitle="Marketplace"
        bannerDescription="Purchase and use our premium components using your credits"
      />
      <div className="container mx-auto px-5 pb-12">
        <Alert
          color="warning"
          title="Demo Template Feature"
          description="This marketplace page demonstrates how to implement a credit-based billing system in your SaaS application. Feel free to use this as a starting point and customize it for your specific needs."
          className="mb-6"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {COMPONENTS.map((component) => (
            <MarketplaceCard
              key={component.id}
              id={component.id}
              name={component.name}
              description={component.description}
              credits={component.credits}
              containerClass={component.containerClass}
              isPurchased={purchasedItems.has(`COMPONENT:${component.id}`)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
