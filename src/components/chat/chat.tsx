"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { Send, Square } from "lucide-react";

interface ChatProps {
  initialChatId?: string;
  initialMessages?: any[];
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  onFirstMessage?: () => void;
}

export function Chat({
  initialChatId,
  initialMessages = [],
  selectedModel = DEFAULT_CHAT_MODEL,
  onFirstMessage,
}: ChatProps) {
  const [chatId, setChatId] = useState(initialChatId || nanoid());
  const [input, setInput] = useState("");
  const selectedModelRef = useRef(selectedModel);
  const [messageCount, setMessageCount] = useState(initialMessages.length);
  
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // Reset chat when initialChatId changes or becomes undefined (new chat)
  useEffect(() => {
    if (initialChatId) {
      setChatId(initialChatId);
    } else {
      setChatId(nanoid());
    }
  }, [initialChatId]);

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
            messages: messages,
            selectedChatModel: selectedModelRef.current,
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

    // If this is the first message in a new chat, notify parent
    if (messageCount === 0 && onFirstMessage) {
      onFirstMessage();
    }
    
    setMessageCount(prev => prev + 1);
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
                  <div>
                    {message.role === "assistant" ? (
                      <ReactMarkdown 
                        className="prose prose-sm max-w-none dark:prose-invert"
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-muted px-1 py-0.5 rounded text-sm">{children}</code>
                            ) : (
                              <code className="block bg-muted p-2 rounded text-sm overflow-x-auto">{children}</code>
                            );
                          },
                          pre: ({ children }) => <div className="bg-muted p-2 rounded overflow-x-auto">{children}</div>,
                        }}
                      >
                        {message.parts
                          ? message.parts.map((part: any) => {
                              switch (part.type) {
                                case 'text':
                                  return part.text;
                                case 'reasoning':
                                  return `*${part.reasoning}*`;
                                default:
                                  return part.text || '';
                              }
                            }).join('')
                          : message.content || ""}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">
                        {message.parts
                          ? message.parts.map((part: any) => part.text).join("")
                          : message.content || ""}
                      </div>
                    )}
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
