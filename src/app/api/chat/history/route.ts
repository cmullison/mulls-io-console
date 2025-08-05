import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/utils/auth';
import { getChatsByUserId } from '@/lib/db/chat-queries';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const chats = await getChatsByUserId({
      userId: session.user.id,
      limit: Math.min(limit, 100), // Cap at 100
      offset,
    });

    return NextResponse.json({ chats });

  } catch (error) {
    console.error('Chat history API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}