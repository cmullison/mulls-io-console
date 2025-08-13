/* eslint-disable jsx-a11y/alt-text */
"use client";

import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { nanoid } from "nanoid";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { useRouter } from "next/navigation";
import {
  Send,
  Square,
  Mic,
  X,
  File,
  Image,
  FileText,
  Wand,
  Globe,
  Plus,
  Wrench,
  ThumbsUp,
  ThumbsDown,
  Copy as CopyIcon,
  MoreVertical,
  Brain,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { toast } from "sonner";

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
  const router = useRouter();
  const [chatId, setChatId] = useState(initialChatId || nanoid());
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const selectedModelRef = useRef(selectedModel);
  const [messageCount, setMessageCount] = useState(initialMessages.length);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // Set chat ID when initialChatId changes
  useEffect(() => {
    if (initialChatId) {
      setChatId(initialChatId);
    } else if (!chatId) {
      // Only generate new ID if we don't have one
      setChatId(nanoid());
    }
  }, [initialChatId, chatId]);

  const { messages, sendMessage, status, stop, error } = useChat({
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
    onFinish: () => {
      // Refresh sidebar after message completes (for new chats to appear)
      if ((window as any).refreshChatSidebar) {
        (window as any).refreshChatSidebar();
      }

      // If this was the first message, navigate to the chat with ID
      if (!initialChatId && chatId) {
        router.replace(`/dashboard/chat/${chatId}`);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Consider anything except "ready" and "error" as busy/streaming
  const isLoading = status !== "ready" && status !== "error";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !files) || isLoading) return;

    // If this is the first message in a new chat, notify parent
    if (messageCount === 0 && onFirstMessage) {
      onFirstMessage();
    }

    setMessageCount((prev) => prev + 1);

    // Use proper AI SDK v5 pattern for files
    sendMessage({
      text: input.trim(),
      files: files || undefined,
    });

    setInput("");
    setFiles(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex flex-col h-full min-w-0 max-w-full overflow-x-hidden">
      {/* Messages area */}
      <ScrollArea className="flex-1 p-4 overflow-x-hidden">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((message: any) => {
              const assistantText =
                message.role === "assistant"
                  ? message.parts
                    ? message.parts
                        .map((part: any) => {
                          switch (part.type) {
                            case "text":
                              return part.text;
                            case "reasoning":
                              return `*${part.reasoning}*`;
                            default:
                              return part.text || "";
                          }
                        })
                        .join("")
                    : message.content || ""
                  : "";
              const hasAssistantContent = assistantText.trim().length > 0;
              return (
                <>
                  <Card
                    key={message.id}
                    className={`p-4 break-words max-w-full overflow-hidden ${
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
                          hasAssistantContent ? (
                            <ReactMarkdown
                              // @ts-expect-error - className is not typed correctly
                              className="prose prose-sm max-w-none dark:prose-invert break-words"
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-2 last:mb-0">{children}</p>
                                ),
                                code: ({ children, className }) => {
                                  const isInline = !className;
                                  return isInline ? (
                                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                                      {children}
                                    </code>
                                  ) : (
                                    <code className="block bg-muted p-2 rounded text-sm overflow-x-auto">
                                      {children}
                                    </code>
                                  );
                                },
                                pre: ({ children }) => (
                                  <div className="bg-muted p-2 rounded overflow-x-auto max-w-full">
                                    {children}
                                  </div>
                                ),
                              }}
                            >
                              {assistantText}
                            </ReactMarkdown>
                          ) : (
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                            </div>
                          )
                        ) : (
                          <div className="whitespace-pre-wrap break-words max-w-full overflow-hidden">
                            {message.parts ? (
                              <div className="space-y-2">
                                {message.parts.map(
                                  (part: any, index: number) => {
                                    if (part.type === "text") {
                                      return <div key={index}>{part.text}</div>;
                                    }
                                    if (part.type === "file") {
                                      if (
                                        part.mediaType?.startsWith("image/")
                                      ) {
                                        return (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img
                                            key={index}
                                            src={part.url}
                                            alt={
                                              part.filename || "Uploaded image"
                                            }
                                            className="max-w-full h-auto rounded-lg"
                                          />
                                        );
                                      }
                                      return (
                                        <div
                                          key={index}
                                          className="flex items-center space-x-2 text-sm text-muted-foreground"
                                        >
                                          <File className="h-4 w-4" />
                                          <span>{part.filename}</span>
                                        </div>
                                      );
                                    }
                                    return null;
                                  }
                                )}
                              </div>
                            ) : (
                              message.content || ""
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                  {message.role === "assistant" && hasAssistantContent && (
                    <div className="mt-2 mr-8 flex items-center gap-1 text-muted-foreground">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Thumbs up"
                        className="h-7 w-7 p-0"
                        onClick={() => toast("Thanks for the feedback!")}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Thumbs down"
                        className="h-7 w-7 p-0"
                        onClick={() => toast("Thanks for the feedback!")}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Copy response"
                        className="h-7 w-7 p-0"
                        onClick={async () => {
                          const copyText = message.parts
                            ? message.parts
                                .map((part: any) =>
                                  part.type === "text"
                                    ? part.text
                                    : part.type === "reasoning"
                                    ? `*${part.reasoning}*`
                                    : part.text || ""
                                )
                                .join("")
                            : message.content || "";
                          try {
                            await navigator.clipboard.writeText(copyText);
                            toast("Copied response to clipboard");
                          } catch {
                            toast("Failed to copy", {
                              description: "Clipboard error",
                            });
                          }
                        }}
                      >
                        <CopyIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="More options"
                        className="h-7 w-7 p-0 ml-1"
                        onClick={() => toast("More options coming soon")}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              );
            })
          )}

          {error && (
            <Card className="mr-8 bg-destructive/10 border-destructive p-4">
              <div className="text-sm text-destructive">
                Error:{" "}
                {error.message || "Failed to send message. Please try again."}
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Input area - Simple sticky */}
      <div className="sticky bottom-0 z-20 bg-background border-t max-w-full overflow-x-hidden">
        <div className="p-4">
          {/* File preview */}
          {files && files.length > 0 && (
            <div className="flex pb-2 !-mt-2 flex-wrap gap-2">
              {Array.from(files).map((file, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-background rounded px-2 py-1 border"
                >
                  {file.type.startsWith("image/") ? (
                    <Image className="h-4 w-4" />
                  ) : file.type === "application/pdf" ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <File className="h-4 w-4" />
                  )}
                  <span className="text-sm truncate max-w-32">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newFiles = Array.from(files).filter(
                        (_, i) => i !== index
                      );
                      const dataTransfer = new DataTransfer();
                      newFiles.forEach((f) => dataTransfer.items.add(f));
                      setFiles(
                        dataTransfer.files.length > 0
                          ? dataTransfer.files
                          : undefined
                      );
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="w-full p-2 border-1 border-border/50 rounded-lg">
            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,text/*,.pdf"
              onChange={(e) => {
                const selectedFiles = e.target.files;
                if (selectedFiles && selectedFiles.length > 0) {
                  // Validate file sizes (max 10MB per file)
                  const maxSize = 10 * 1024 * 1024; // 10MB
                  const validFiles = Array.from(selectedFiles).filter(
                    (file) => {
                      if (file.size > maxSize) {
                        console.warn(
                          `File ${file.name} is too large (${(
                            file.size /
                            1024 /
                            1024
                          ).toFixed(2)}MB). Max size is 10MB.`
                        );
                        return false;
                      }
                      return true;
                    }
                  );

                  if (validFiles.length > 0) {
                    const dataTransfer = new DataTransfer();
                    validFiles.forEach((file) => dataTransfer.items.add(file));
                    setFiles(dataTransfer.files);
                  } else {
                    setFiles(undefined);
                  }
                } else {
                  setFiles(undefined);
                }
              }}
            />

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Textarea and send/mic buttons */}
              <div className="flex space-x-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message here..."
                  className="flex-1 min-h-[32px] max-h-[200px] resize-none !ring-0 !border-0 !shadow-none"
                  disabled={isLoading}
                />
                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => toast("Realtime voice coming soon!")}
                    className="shrink-0"
                    disabled={isLoading}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  {isLoading ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={stop}
                      aria-label="Stop generating"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={(!input.trim() && !files) || isLoading}
                      size="icon"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {/* Bottom row of buttons */}
              <div className="flex justify-start space-x-2 w-full">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toast("Web search coming soon!")}
                  className="h-7 px-2"
                >
                  <Globe className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 px-2"
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toast("Reasoning coming soon!")}
                  className="h-7 px-2"
                >
                  <Brain className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toast("Tools coming soon!")}
                  className="h-7 px-2"
                >
                  <Wrench className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toast("Transform with AI coming soon!")}
                  className="h-7 px-2"
                >
                  <Wand className="h-3 w-3" />
                </Button>
                <div className="hidden md:flex text-xs ml-auto items-center text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
