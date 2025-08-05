import { NextRequest, NextResponse } from 'next/server';
import { createUIMessageStream, convertToModelMessages, JsonToSseTransformStream } from 'ai';
import { streamText } from 'ai';
import { getSessionFromCookie } from '@/utils/auth';
import { aiProvider } from '@/lib/ai/providers';
import {
  createChat,
  createMessage,
  getChatById,
  getMessagesByChatId,
  generateChatTitle,
  getMessageCountByUserId,
  deleteChatById
} from '@/lib/db/chat-queries';
import { z } from 'zod';

export const maxDuration = 60;

// Define schema for all possible message part types from AI SDK
const messagePartSchema = z.union([
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('reasoning'),
    reasoning: z.string(),
  }),
  z.object({
    type: z.literal('step-start'),
  }),
  z.object({
    type: z.literal('tool'),
    tool: z.any(),
  }),
  z.object({
    type: z.literal('file'),
    url: z.string(),
    mediaType: z.string(),
  }),
  // Catch-all for any other part types
  z.object({
    type: z.string(),
  }).passthrough(),
]);

const requestSchema = z.object({
  id: z.string(),
  message: z.object({
    id: z.string(),
    role: z.literal('user'),
    parts: z.array(messagePartSchema),
  }),
  messages: z.array(z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    parts: z.array(messagePartSchema).optional(),
    content: z.string().optional(),
  })).optional(),
  selectedChatModel: z.string(),
  selectedVisibilityType: z.enum(['public', 'private']).default('private'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, message, messages, selectedChatModel, selectedVisibilityType } = requestSchema.parse(body);

    // Check rate limits (basic implementation)
    const messageCount = await getMessageCountByUserId({
      userId: session.user.id,
      differenceInHours: 24,
    });

    if (messageCount > 100) { // Basic rate limit
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // Get or create chat
    let chat = await getChatById(id);
    if (!chat) {
      // @ts-expect-error - message.parts is not typed correctly
      const userText = message.parts.map(part => part.text).join(' ');
      const title = await generateChatTitle(userText);
      chat = await createChat({
        title,
        userId: session.user.id,
        visibility: selectedVisibilityType,
        model: selectedChatModel,
      });
    } else if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Use messages from frontend if available, otherwise get from database
    let uiMessages;
    if (messages && messages.length > 0) {
      // Use the full conversation history from frontend
      uiMessages = messages;
    } else {
      // Fallback to database messages (for existing chats without frontend history)
      const messagesFromDb = await getMessagesByChatId(chat.id);
      const existingUIMessages = messagesFromDb.map(msg => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts as any,
        createdAt: msg.createdAt,
      }));
      // Add the new user message to UI messages array
      uiMessages = [...existingUIMessages, message];
    }

    // Save the user message to database
    await createMessage({
      chatId: chat.id,
      role: message.role,
      parts: message.parts,
      attachments: [],
    });

    // Create the AI response stream
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          model: aiProvider.languageModel(selectedChatModel),
          messages: convertToModelMessages(uiMessages as any),
          system: 'You are a helpful AI assistant. Provide clear, accurate, and helpful responses.',
        });

        result.consumeStream();
        writer.merge(result.toUIMessageStream());
      },
      generateId: () => `msg_${Math.random().toString(36).substring(2, 15)}`,
      onFinish: async ({ messages }) => {
        // Save AI messages to database
        for (const msg of messages) {
          if (msg.role === 'assistant') {
            await createMessage({
              chatId: chat.id,
              role: msg.role,
              parts: msg.parts as any,
              attachments: [],
            });
          }
        }
      },
      onError: () => {
        return 'An error occurred while processing your request.';
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    const chat = await getChatById(id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the chat (this will cascade to messages and votes)
    const deleted = await deleteChatById({ id, userId: session.user.id });

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}