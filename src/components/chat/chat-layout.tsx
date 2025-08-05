"use client";

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Chat } from './chat';
import { ChatSidebar } from './chat-sidebar';

interface ChatLayoutProps {
  initialChatId?: string;
  initialMessages?: any[];
  userId?: string;
}

export function ChatLayout({ initialChatId, initialMessages = [], userId }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full w-full">
      {/* Chat Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block transition-all duration-200`}>
        <ChatSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userId={userId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with toggle button */}
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Chat</h1>
          </div>
        </div>

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden">
          <Chat
            initialChatId={initialChatId}
            initialMessages={initialMessages}
          />
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}