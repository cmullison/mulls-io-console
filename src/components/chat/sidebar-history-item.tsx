"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';
import {
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Chat } from '@/db/schema';

interface ChatItemProps {
  chat: Chat;
  onDelete?: (chatId: string) => void;
  onUpdate?: (chatId: string, title: string) => void;
}

export function ChatItem({ chat, onDelete, onUpdate }: ChatItemProps) {
  const { setOpenMobile } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat.title);

  const isActive = params.id === chat.id;

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/chat?id=${chat.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.(chat.id);
        if (isActive) {
          router.push('/dashboard/chat');
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
    setShowDeleteAlert(false);
  };

  const handleSaveEdit = async () => {
    if (editedTitle.trim() && editedTitle !== chat.title) {
      onUpdate?.(chat.id, editedTitle.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditedTitle(chat.title);
      setIsEditing(false);
    }
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive}
          className="group data-[active=true]:bg-accent/50"
        >
          <div className="flex items-center w-full">
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleSaveEdit}
                onKeyDown={handleKeyDown}
                className="h-7 text-sm border-0 bg-transparent focus-visible:ring-1"
                autoFocus
              />
            ) : (
              <Link
                href={`/dashboard/chat/${chat.id}`}
                className="flex items-center w-full min-w-0"
                onClick={() => setOpenMobile(false)}
              >
                <span className="truncate text-sm">{chat.title}</span>
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditing(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDeleteAlert(true);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}