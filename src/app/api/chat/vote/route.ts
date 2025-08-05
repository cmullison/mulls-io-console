import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/utils/auth';
import { createOrUpdateVote, getChatById } from '@/lib/db/chat-queries';
import { z } from 'zod';

const voteSchema = z.object({
  chatId: z.string(),
  messageId: z.string(),
  isUpvoted: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, messageId, isUpvoted } = voteSchema.parse(body);

    // Verify the user owns the chat
    const chat = await getChatById(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const vote = await createOrUpdateVote({
      chatId,
      messageId,
      userId: session.user.id,
      isUpvoted,
    });

    return NextResponse.json({ vote });

  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}