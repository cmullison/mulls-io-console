"use client";

import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHistory } from "./sidebar-history";
import { useRouter } from "next/navigation";

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function ChatSidebar({ isOpen, onClose, userId }: ChatSidebarProps) {
  const router = useRouter();

  const handleNewChat = () => {
    router.push("/dashboard/chat");
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 bg-background border-r shadow-lg md:relative md:inset-y-auto md:shadow-none">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold">Chats</h2>
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
        <ScrollArea className="flex-1">
          <div className="p-2">
            <SidebarHistory userId={userId} />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
