"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModelSelector } from "./model-selector";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { Send, Square } from "lucide-react";

interface ChatProps {
  initialChatId?: string;
  initialMessages?: any[];
}

export function Chat({ initialChatId, initialMessages = [] }: ChatProps) {
  const [chatId] = useState(initialChatId || nanoid());
  const [selectedModel, setSelectedModel] = useState(DEFAULT_CHAT_MODEL);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            message: messages.at(-1),
            selectedChatModel: selectedModel,
            selectedVisibilityType: "private",
            ...body,
          },
        };
      },
    }),
  });

  // @ts-expect-error - status is not typed
  const isLoading = status === "in_progress";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: nanoid(),
      role: "user" as const,
      parts: [{ type: "text" as const, text: input.trim() }],
    };

    sendMessage(userMessage);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with model selector */}
      <div className="flex items-center justify-end p-4 border-b">
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          disabled={isLoading}
        />
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((message: any) => (
              <Card
                key={message.id}
                className={`p-4 ${
                  message.role === "user"
                    ? "ml-8 bg-primary text-primary-foreground"
                    : "mr-8 bg-muted"
                }`}
              >
                <div className="space-y-2">
                  <div className="text-xs opacity-70 capitalize">
                    {message.role}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {message.parts
                      ? message.parts.map((part: any) => part.text).join("")
                      : message.content || ""}
                  </div>
                </div>
              </Card>
            ))
          )}

          {isLoading && (
            <Card className="mr-8 bg-muted p-4">
              <div className="space-y-2">
                <div className="text-xs opacity-70">Assistant</div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="flex-1 min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <div className="flex flex-col space-y-2">
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
              {isLoading && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={stop}
                >
                  <Square className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
}
