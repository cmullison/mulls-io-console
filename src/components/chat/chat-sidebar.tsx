"use client";

import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHistory } from "./sidebar-history";
import { useRouter, usePathname } from "next/navigation";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function ChatSidebar({ isOpen, onClose, userId }: ChatSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleNewChat = () => {
    // Always push to chat page - the Chat component will handle resetting when initialChatId is undefined
    router.push("/dashboard/chat");

    // If we're already on the chat page, also trigger a refresh to ensure clean state
    if (pathname === "/dashboard/chat") {
      setTimeout(() => {
        router.refresh();
      }, 0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-background border-r shadow-lg md:relative md:inset-y-auto md:shadow-none md:h-full">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between h-12 p-4 border-b">
          <div className="flex items-center justify-between w-full">
            <h2 className="font-semibold">History</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="h-7 w-7 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 h-0">
          <div className="min-h-full">
            <SidebarHistory userId={userId} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
