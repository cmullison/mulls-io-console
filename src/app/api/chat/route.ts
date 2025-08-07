/* eslint-disable @typescript-eslint/no-unused-vars */
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

    // Extract the values we need
    const {
      // @ts-expect-error - body is not typed
      id,
      // @ts-expect-error - body is not typed
      message,
      // @ts-expect-error - body is not typed
      messages,
      // @ts-expect-error - body is not typed
      selectedChatModel = 'claude-sonnet-4-20250514',
      // @ts-expect-error - body is not typed
      selectedVisibilityType = 'private',
    } = body;

    if (!id || !message) {
      console.error('Missing required fields:', { id, message });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
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
      const userText = (message.parts as any).filter((part: any) => part.type === 'text').map((part: any) => part.text).join(' ');
      const title = await generateChatTitle(userText);
      chat = await createChat({
        id, // Use the chat ID from the frontend
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
      // BUT: Make sure the last message has the full file data from the current request
      const allButLast = messages.slice(0, -1);
      uiMessages = [...allButLast, message]; // Use the fresh message with full file data
    } else {
      // Fallback to database messages (for existing chats without frontend history)
      const messagesFromDb = await getMessagesByChatId(chat.id);
      const existingUIMessages = messagesFromDb.map(msg => ({
        id: msg.id,
        role: msg.role,
        parts: msg.parts as any,
        createdAt: msg.createdAt,
      }));
      // IMPORTANT: Use the original message with full file data, not the one from DB
      uiMessages = [...existingUIMessages, message];
    }

    // Ensure message has proper structure
    const messageParts = message.parts || [{ type: 'text', text: message.content || '' }];



        // Extract attachments from file parts
    const attachments = messageParts
      .filter((part: any) => part.type === 'file')
      .map((part: any) => ({
        url: part.url || part.data,
        contentType: part.mediaType || part.mimeType || 'application/octet-stream',
        name: part.name || part.filename || 'unnamed'
      }));

    // Save the user message to database
    // Filter out file data to avoid SQLite size limits
    const partsForDB = messageParts.map((part: any) => {
      if (part.type === 'file') {
        // Store metadata only, not the actual data
        return {
          type: 'file',
          mediaType: part.mediaType || part.mimeType,
          filename: part.filename || part.name,
          size: part.data ? part.data.length : 0,
          // Don't store the actual data
        };
      }
      return part;
    });

    await createMessage({
      chatId: chat.id,
      role: message.role,
      parts: partsForDB,
      attachments: [], // Don't store attachments with full data
    });



    // Process messages for AI model
    const processedMessages = uiMessages.map((msg: any) => {
      const content: any[] = [];

      // Process parts if they exist
      if (msg.parts && Array.isArray(msg.parts)) {
        for (const part of msg.parts) {
          if (part.type === 'text' && part.text) {
            content.push({ type: 'text', text: part.text });
          } else if (part.type === 'file') {
            // Check if it's an image
            const mediaType = part.mediaType || part.mimeType || '';
            if (mediaType.startsWith('image/')) {
              // The AI SDK sends files as data URLs in the 'data' field
              const imageData = part.data || part.url || part.content;
              if (imageData) {
                content.push({
                  type: 'image',
                  image: imageData,
                });
              }
            }
          }
        }
      }

      // If no content from parts, use msg.content
      if (content.length === 0 && msg.content) {
        return { role: msg.role, content: msg.content };
      }

      // Return with content array or at least empty text
      if (content.length === 0) {
        content.push({ type: 'text', text: '' });
      }

      return { role: msg.role, content };
    }).filter((msg: any) => msg.content && (Array.isArray(msg.content) ? msg.content.length > 0 : true));

    // Create the AI response stream
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const result = streamText({
          model: aiProvider.languageModel(selectedChatModel),
          messages: processedMessages,
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
            // Filter out any large data from parts
            const partsForDB = (msg.parts || []).map((part: any) => {
              if (part.type === 'file' || (part.data && part.data.length > 10000)) {
                // Don't store large data
                return {
                  type: part.type,
                  text: '[File data omitted]'
                };
              }
              return part;
            });

            await createMessage({
              chatId: chat.id,
              role: msg.role,
              parts: partsForDB,
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
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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