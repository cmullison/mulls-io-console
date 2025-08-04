import { getSessionFromCookie } from "@/utils/auth";
import { redirect } from "next/navigation";
import { CreateTeamForm } from "@/components/teams/create-team-form";
import { PageHeader } from "@/components/page-header";
import PageBanner from "@/components/page-banner";

export const metadata = {
  title: "Create Team",
  description: "Create a new team for your organization",
};

export default async function CreateTeamPage() {
  // Check if the user is authenticated
  const session = await getSessionFromCookie();

  if (!session) {
    redirect("/sign-in?redirect=/dashboard/teams/create");
  }

  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard/teams",
            label: "Teams",
          },
          {
            href: "/dashboard/teams/create",
            label: "Create Team",
          },
        ]}
      />
      <PageBanner
        bannerTitle="Create Team"
        bannerDescription="Create a new team to collaborate with others on projects and share resources."
      />
      <div className="container mx-auto px-5 pt-6 pb-12">
        <div className="max-w-xl mx-auto">
          <div className="border rounded-lg p-6 bg-card">
            <CreateTeamForm />
          </div>
        </div>
      </div>
    </>
  );
}
