import type { Metadata } from "next";
import { ChatLayout } from "@/components/chat/chat-layout";
import { getSessionFromCookie } from "@/utils/auth";
import { getChatById, getMessagesByChatId } from "@/lib/db/chat-queries";
import { notFound, redirect } from "next/navigation";

interface ChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ChatPageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await getSessionFromCookie();
  if (!session?.user) {
    return { title: "Chat" };
  }

  try {
    const chat = await getChatById(id);
    if (!chat || chat.userId !== session.user.id) {
      return { title: "Chat" };
    }

    return {
      title: `${chat.title} - Chat`,
      description: `Chat conversation: ${chat.title}`,
    };
  } catch {
    return { title: "Chat" };
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  const session = await getSessionFromCookie();
  
  if (!session?.user) {
    redirect("/login");
  }

  let chat;
  let messages = [];

  try {
    chat = await getChatById(id);
    
    if (!chat) {
      notFound();
    }

    if (chat.userId !== session.user.id) {
      notFound();
    }

    // Get messages for this chat
    const dbMessages = await getMessagesByChatId(id);
    
    // Convert to UI format
    messages = dbMessages.map(msg => ({
      id: msg.id,
      role: msg.role,
      parts: msg.parts as any,
      createdAt: msg.createdAt,
    }));

  } catch (error) {
    console.error("Error loading chat:", error);
    notFound();
  }
  
  return (
    <div className="h-full">
      <ChatLayout 
        initialChatId={id}
        initialMessages={messages}
        userId={session.user.id} 
      />
    </div>
  );
}