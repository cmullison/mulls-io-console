"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chat } from "./chat";
import { ChatSidebar } from "./chat-sidebar";
import { ModelSelector } from "./model-selector";
import { chatModels, DEFAULT_CHAT_MODEL } from "@/lib/ai/models";

interface ChatLayoutProps {
  initialChatId?: string;
  initialMessages?: any[];
  userId?: string;
  chatTitle?: string;
  chatModel?: string;
}

export function ChatLayout({
  initialChatId,
  initialMessages = [],
  userId,
  chatTitle,
  chatModel,
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);
  const [hasMessages, setHasMessages] = useState(initialMessages.length > 0);

  // Load sidebar state and selected model from localStorage on mount
  useEffect(() => {
    const savedSidebarState = localStorage.getItem("chat-sidebar-open");
    if (savedSidebarState !== null) {
      setSidebarOpen(JSON.parse(savedSidebarState));
    }

    const savedModel = localStorage.getItem("chat-selected-model");
    if (savedModel) {
      setSelectedModel(savedModel);
    }
  }, []);

  // Save sidebar state to localStorage when it changes
  const handleSidebarToggle = (open: boolean) => {
    setSidebarOpen(open);
    localStorage.setItem("chat-sidebar-open", JSON.stringify(open));
  };

  // Save selected model to localStorage when it changes
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem("chat-selected-model", modelId);
  };

  return (
    <div className="flex h-full w-full min-w-0 overflow-x-hidden">
      {/* Chat Sidebar */}
      {sidebarOpen && (
        <ChatSidebar
          isOpen={sidebarOpen}
          onClose={() => handleSidebarToggle(false)}
          userId={userId}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with toggle button */}
        <div className="flex items-center justify-between h-12 p-4 border-b bg-background overflow-x-hidden">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSidebarToggle(!sidebarOpen)}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            {hasMessages ? (
              <h1 className="text-base md:text-lg font-semibold truncate max-w-full">
                {chatTitle}
              </h1>
            ) : (
              <h1 className="text-base md:text-lg font-semibold truncate max-w-full">
                New Chat
              </h1>
            )}
          </div>
          {hasMessages && chatModel ? (
            <div className="flex items-center gap-3 max-w-[45%] md:max-w-none min-w-0 overflow-hidden">
              <span className="text-xs md:text-sm text-muted-foreground truncate max-w-full">
                {chatModels.find((m) => m.id === chatModel)?.name ||
                  selectedModel}
              </span>
            </div>
          ) : !hasMessages ? (
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={handleModelChange}
              disabled={isLoading}
            />
          ) : null}
        </div>

        {/* Chat Component */}
        <div className="flex-1 overflow-hidden">
          <Chat
            key={initialChatId || "new-chat"}
            initialChatId={initialChatId}
            initialMessages={initialMessages}
            selectedModel={selectedModel}
            onFirstMessage={() => setHasMessages(true)}
          />
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => handleSidebarToggle(false)}
        />
      )}
    </div>
  );
}
