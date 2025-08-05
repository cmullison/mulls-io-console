import type { Metadata } from "next";
import { ChatLayout } from "@/components/chat/chat-layout";
import { getSessionFromCookie } from "@/utils/auth";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Chat",
  description: "AI-powered chat assistant",
  openGraph: {
    title: "Chat - Mulls.io Console",
    description: "AI-powered chat assistant",
    images: [
      "/api/og?title=Chat&description=AI%20powered%20chat%20assistant&type=dashboard",
    ],
  },
  twitter: {
    title: "Chat - Mulls.io Console",
    description: "AI-powered chat assistant",
    images: [
      "/api/og?title=Chat&description=AI%20powered%20chat%20assistant&type=dashboard",
    ],
  },
};

export default async function ChatPage() {
  const session = await getSessionFromCookie();

  return (
    <>
      <PageHeader
        items={[
          {
            href: "/dashboard",
            label: "Dashboard",
          },
          {
            href: "/dashboard/chat",
            label: "Chat",
          },
        ]}
      />
      <ChatLayout userId={session?.user?.id} />
    </>
  );
}
