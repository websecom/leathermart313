import { auth } from '@clerk/nextjs/server';
import { clearChatHistory, loadChatHistory } from 'lib/chat-history';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/chat/history — load persisted messages for the signed-in user */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ messages: [] });
  }
  const messages = await loadChatHistory(userId, 60);
  return NextResponse.json({ messages });
}

/** DELETE /api/chat/history — clear all history for the signed-in user */
export async function DELETE() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ cleared: false, reason: 'Not signed in.' });
  }
  await clearChatHistory(userId);
  return NextResponse.json({ cleared: true });
}
