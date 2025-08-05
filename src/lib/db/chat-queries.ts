import "server-only";

import { asc, desc, eq, and, count } from "drizzle-orm";
import { getDB } from "@/db";
import { chatTable, messageTable, voteTable } from "@/db/schema";
import type { Chat, Message, Vote } from "@/db/schema";
import { createId } from '@paralleldrive/cuid2';

// Chat operations
export async function createChat({
  title,
  userId,
  visibility = 'private'
}: {
  title: string;
  userId: string;
  visibility?: 'public' | 'private';
}): Promise<Chat> {
  const db = getDB();
  const [chat] = await db
    .insert(chatTable)
    .values({
      id: `chat_${createId()}`,
      title,
      userId,
      visibility,
    })
    .returning();

  return chat;
}

export async function getChatById(id: string): Promise<Chat | null> {
  const db = getDB();
  const [chat] = await db
    .select()
    .from(chatTable)
    .where(eq(chatTable.id, id))
    .limit(1);

  return chat || null;
}

export async function getChatsByUserId({
  userId,
  limit = 50,
  offset = 0,
}: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<Chat[]> {
  const db = getDB();
  return await db
    .select()
    .from(chatTable)
    .where(eq(chatTable.userId, userId))
    .orderBy(desc(chatTable.updatedAt))
    .limit(limit)
    .offset(offset);
}

export async function updateChatTitle({
  id,
  title,
  userId,
}: {
  id: string;
  title: string;
  userId: string;
}): Promise<Chat | null> {
  const db = getDB();
  const [chat] = await db
    .update(chatTable)
    .set({ title })
    .where(and(eq(chatTable.id, id), eq(chatTable.userId, userId)))
    .returning();

  return chat || null;
}

export async function deleteChatById({
  id,
  userId,
}: {
  id: string;
  userId: string;
}): Promise<boolean> {
  const db = getDB();
  // First delete all messages and votes associated with the chat
  await db.delete(voteTable).where(eq(voteTable.chatId, id));
  await db.delete(messageTable).where(eq(messageTable.chatId, id));

  // Then delete the chat
  const result = await db
    .delete(chatTable)
    .where(and(eq(chatTable.id, id), eq(chatTable.userId, userId)));
// @ts-expect-error - result is not typed
  return result.changes > 0;
}

// Message operations
export async function createMessage({
  chatId,
  role,
  parts,
  attachments = [],
}: {
  chatId: string;
  role: string;
  parts: unknown[];
  attachments?: unknown[];
}): Promise<Message> {
  const db = getDB();
  const [message] = await db
    .insert(messageTable)
    .values({
      id: `msg_${createId()}`,
      chatId,
      role,
      parts: parts as any,
      attachments: attachments as any,
    })
    .returning();

  return message;
}

export async function getMessagesByChatId(chatId: string): Promise<Message[]> {
  const db = getDB();
  return await db
    .select()
    .from(messageTable)
    .where(eq(messageTable.chatId, chatId))
    .orderBy(asc(messageTable.createdAt));
}

export async function getMessageCountByUserId({
  userId,
  differenceInHours = 24,
}: {
  userId: string;
  differenceInHours?: number;
}): Promise<number> {
  const db = getDB();
  const sinceDate = new Date();
  sinceDate.setHours(sinceDate.getHours() - differenceInHours);

  const [result] = await db
    .select({ count: count() })
    .from(messageTable)
    .innerJoin(chatTable, eq(messageTable.chatId, chatTable.id))
    .where(
      and(
        eq(chatTable.userId, userId),
        eq(messageTable.role, 'user')
      )
    );

  return result.count;
}

// Vote operations
export async function createOrUpdateVote({
  chatId,
  messageId,
  userId,
  isUpvoted,
}: {
  chatId: string;
  messageId: string;
  userId: string;
  isUpvoted: boolean;
}): Promise<Vote> {
  const db = getDB();
  // Try to update existing vote first
  const [existingVote] = await db
    .select()
    .from(voteTable)
    .where(
      and(
        eq(voteTable.chatId, chatId),
        eq(voteTable.messageId, messageId),
        eq(voteTable.userId, userId)
      )
    )
    .limit(1);

  if (existingVote) {
    const [updatedVote] = await db
      .update(voteTable)
      .set({ isUpvoted })
      .where(
        and(
          eq(voteTable.chatId, chatId),
          eq(voteTable.messageId, messageId),
          eq(voteTable.userId, userId)
        )
      )
      .returning();
    return updatedVote;
  } else {
    const [newVote] = await db
      .insert(voteTable)
      .values({
        chatId,
        messageId,
        userId,
        isUpvoted,
      })
      .returning();
    return newVote;
  }
}

export async function getVotesByChatId(chatId: string): Promise<Vote[]> {
  const db = getDB();
  return await db
    .select()
    .from(voteTable)
    .where(eq(voteTable.chatId, chatId));
}

// Utility functions
export async function generateChatTitle(userMessage: string): Promise<string> {
  // Simple title generation - could be enhanced with AI
  const words = userMessage.split(' ').slice(0, 6);
  return words.join(' ') + (userMessage.split(' ').length > 6 ? '...' : '');
}