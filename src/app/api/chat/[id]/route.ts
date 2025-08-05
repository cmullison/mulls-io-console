import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/utils/auth';
import { getChatById, updateChatTitle, deleteChatById } from '@/lib/db/chat-queries';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).max(100),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title } = updateSchema.parse(body);

    const chat = await getChatById(id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedChat = await updateChatTitle({
      id,
      title,
      userId: session.user.id,
    });

    if (!updatedChat) {
      return NextResponse.json({ error: 'Failed to update chat' }, { status: 500 });
    }

    return NextResponse.json(updatedChat);

  } catch (error) {
    console.error('Update chat error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const chat = await getChatById(id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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