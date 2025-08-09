"use client";

import { useState, useEffect } from "react";
import { isToday, isYesterday, subWeeks, subMonths } from "date-fns";
import useSWR from "swr";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar";
import { ChatItem } from "./sidebar-history-item";
import type { Chat } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

interface ChatHistory {
  chats: Chat[];
}

const fetcher = async (url: string): Promise<ChatHistory> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch chat history");
  }
  return response.json();
};

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const oneWeekAgo = subWeeks(now, 1);
  const oneMonthAgo = subMonths(now, 1);

  return chats.reduce(
    (groups, chat) => {
      const chatDate = new Date(chat.updatedAt);

      if (isToday(chatDate)) {
        groups.today.push(chat);
      } else if (isYesterday(chatDate)) {
        groups.yesterday.push(chat);
      } else if (chatDate > oneWeekAgo) {
        groups.lastWeek.push(chat);
      } else if (chatDate > oneMonthAgo) {
        groups.lastMonth.push(chat);
      } else {
        groups.older.push(chat);
      }

      return groups;
    },
    {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: [],
    } as GroupedChats
  );
};

interface SidebarHistoryProps {
  userId?: string;
}

export function SidebarHistory({ userId }: SidebarHistoryProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );

  const { data, error, mutate } = useSWR<ChatHistory, Error>(
    userId ? "/api/chat/history?limit=50" : null,
    userId ? fetcher : null,
    {
      refreshInterval: 10000, // Refresh every 10 seconds for auto-renaming
      revalidateOnFocus: true, // Refresh when tab becomes active
      revalidateOnReconnect: true, // Refresh when network reconnects
      dedupingInterval: 2000, // Prevent duplicate requests within 2 seconds
    }
  );

  // Expose mutate function for external updates
  useEffect(() => {
    // Store mutate function globally for other components to trigger refresh
    (window as any).refreshChatSidebar = () => mutate();

    return () => {
      delete (window as any).refreshChatSidebar;
    };
  }, [mutate]);

  const handleDelete = async (chatId: string) => {
    if (data) {
      // Optimistically remove the chat from UI immediately
      const optimisticData = {
        ...data,
        chats: data.chats.filter((chat) => chat.id !== chatId),
      };

      // Update cache immediately with optimistic data
      mutate(optimisticData, false);
    }
  };

  const handleUpdate = async (chatId: string, title: string) => {
    // Optimistically update the title in the UI
    if (data) {
      const optimisticData = {
        ...data,
        chats: data.chats.map((chat) =>
          chat.id === chatId ? { ...chat, title } : chat
        ),
      };
      mutate(optimisticData, false);
    }

    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        // Revalidate to ensure consistency
        mutate();
      } else {
        // Revert on error
        mutate();
      }
    } catch (error) {
      console.error("Failed to update chat title:", error);
      // Revert on error
      mutate();
    }
  };

  const toggleGroup = (groupName: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    setCollapsedGroups(newCollapsed);
  };

  if (error) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Chat History</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="text-sm text-muted-foreground p-2">
            Failed to load chat history
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (!data) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Chat History</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="text-sm text-muted-foreground p-2">Loading...</div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  const groupedChats = groupChatsByDate(data.chats);
  const groups = [
    { name: "today", label: "Today", chats: groupedChats.today },
    { name: "yesterday", label: "Yesterday", chats: groupedChats.yesterday },
    { name: "lastWeek", label: "Last 7 days", chats: groupedChats.lastWeek },
    { name: "lastMonth", label: "Last 30 days", chats: groupedChats.lastMonth },
    { name: "older", label: "Older", chats: groupedChats.older },
  ].filter((group) => group.chats.length > 0);

  if (groups.length === 0) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Chat History</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="text-sm text-muted-foreground p-2">
            No chats yet. Start a conversation!
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chat History</SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="space-y-2">
          {groups.map((group) => {
            const isCollapsed = collapsedGroups.has(group.name);
            return (
              <div key={group.name}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-6 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => toggleGroup(group.name)}
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3 mr-1" />
                  ) : (
                    <ChevronDown className="h-3 w-3 mr-1" />
                  )}
                  {group.label} ({group.chats.length})
                </Button>
                {!isCollapsed && (
                  <SidebarMenu className="">
                    {group.chats.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                      />
                    ))}
                  </SidebarMenu>
                )}
              </div>
            );
          })}
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
