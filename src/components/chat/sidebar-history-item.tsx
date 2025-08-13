"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { Chat } from "@/db/schema";
import { cn } from "@/lib/utils";

interface ChatItemProps {
  chat: Chat;
  onDelete?: (chatId: string) => void;
  onUpdate?: (chatId: string, title: string) => void;
}

export function ChatItem({ chat, onDelete, onUpdate }: ChatItemProps) {
  const { setOpenMobile } = useSidebar();
  const params = useParams();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const isActive = params.id === chat.id;

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDelete = async () => {
    setShowDeleteAlert(false);

    // Immediately call onDelete for optimistic update
    onDelete?.(chat.id);

    // If this is the active chat, navigate away
    if (isActive) {
      window.location.href = "/dashboard/chat";
    }

    // Then make the delete request in background
    try {
      const response = await fetch(`/api/chat/${chat.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Failed to delete chat:", await response.text());
        // Refresh to revert if delete failed
        if ((window as any).refreshChatSidebar) {
          (window as any).refreshChatSidebar();
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
      // Refresh to revert if delete failed
      if ((window as any).refreshChatSidebar) {
        (window as any).refreshChatSidebar();
      }
    }
  };

  const handleSaveEdit = () => {
    if (editedTitle.trim() && editedTitle !== chat.title) {
      onUpdate?.(chat.id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      setEditedTitle(chat.title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <SidebarMenuItem>
        <div className="flex items-center px-2 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveEdit}
            className="flex-1 bg-transparent outline-none text-sm"
            placeholder="Chat title..."
          />
        </div>
      </SidebarMenuItem>
    );
  }

  return (
    <>
      <SidebarMenuItem>
        <div className="group flex items-center gap-1">
          <SidebarMenuButton asChild isActive={isActive} className="flex-1">
            <Link
              href={`/dashboard/chat/${chat.id}`}
              onClick={() => setOpenMobile(false)}
            >
              <span className="truncate">{chat.title}</span>
            </Link>
          </SidebarMenuButton>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Chat options"
                className={cn(
                  "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 transition-opacity",
                  isActive && "opacity-100"
                )}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="right">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowDeleteAlert(true)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
